// Define the models in order of preference
const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',       // fallback 1
  'gemini-2.5-flash-lite',  // fallback 2 - least busy
];

// Helper function: Tries to fetch data using a specific model with simple retries
async function fetchWithRetry(url, options, retries = 2, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    const data = await response.json();

    // If it's a 503 (Service Unavailable) or a "high demand" error, wait and retry
    if (response.status === 503 || data.error?.message?.includes('high demand') || data.error?.message?.includes('overloaded')) {
      if (i < retries - 1) {
        // Wait before retrying (exponential backoff: 1.5s, then 3s)
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
        continue;
      }
    }
    // Return the response (whether successful or a hard failure)
    return { response, data };
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API Key missing in Vercel' });
  }

  const { system, messages, max_tokens } = req.body;

  // Format messages for Gemini ('user' or 'model')
  const formattedMessages = messages.map(m => ({
    role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
    parts: [{ text: m.content || '' }]
  }));

  const payload = {
    system_instruction: { parts: [{ text: system || "You are a helpful assistant." }] },
    contents: formattedMessages,
    generationConfig: { maxOutputTokens: max_tokens || 1000, temperature: 0.7 }
  };

  let lastErrorData = null;
  let lastStatus = 500;

  // Loop through the models in order of preference
  for (const modelName of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    try {
      // Try to fetch using the current model (includes internal retries)
      const { response, data } = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // If successful, return the data immediately and stop checking other models
      if (response.ok) {
        return res.status(200).json(data);
      }

      // If the model is not found (404), overloaded (503), or hits a quota issue (429),
      // we save the error but allow the loop to continue to the NEXT model.
      lastErrorData = data;
      lastStatus = response.status;
      
      // We ONLY fall back to the next model for capacity/server issues.
      // If the error is a bad request (400) like invalid JSON, we shouldn't retry it on another model.
      if (response.status === 400) {
           return res.status(400).json({ error: data.error?.message || 'Bad Request Format' });
      }

      console.log(`Model ${modelName} failed with status ${response.status}. Trying next model...`);

    } catch (error) {
      // Catch network-level errors (like fetch failing entirely)
      lastErrorData = { error: { message: error.message } };
      lastStatus = 500;
      console.error(`Network error with ${modelName}:`, error);
    }
  }

  // If we exhaust the entire array of MODELS and none succeed, return the last error encountered.
  return res.status(lastStatus).json({ 
      error: lastErrorData?.error?.message || 'All models failed to respond.' 
  });
};