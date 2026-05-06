// The ACTUAL, currently available Google Gemini models
const MODELS = [
  'gemini-1.5-flash',       // Fast, standard, free tier
  'gemini-1.5-flash-8b'   // Lightweight fallback
  //'gemini-1.5-pro'          // High-tier final fallback
];

// Robust retry logic for high demand / network hiccups
async function fetchWithRetry(url, options, retries = 3, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      // If Google's servers are overloaded (429, 503, or high demand message)
      if (response.status === 429 || response.status === 503 || (data.error?.message && data.error.message.toLowerCase().includes('high demand'))) {
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, delayMs * (i + 1))); // Wait and retry
          continue;
        }
      }
      return { response, data };
    } catch (err) {
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      return { response: { ok: false, status: 500 }, data: { error: { message: err.message } } };
    }
  }
}

// The core Vercel Serverless Function
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API Key missing in Vercel settings.' });
  }

  const { system, messages, max_tokens } = req.body;

  // Enforce strict Gemini roles ('user' or 'model')
  const formattedMessages = (messages || []).map(m => ({
    role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
    parts: [{ text: m.content || ' ' }]
  }));

  const payload = {
    system_instruction: { parts: [{ text: system || "You are a helpful assistant." }] },
    contents: formattedMessages,
    generationConfig: { maxOutputTokens: max_tokens || 1000, temperature: 0.7 }
  };

  let lastErrorMsg = 'Unknown error';
  let lastStatus = 500;

  // Loop through the actual models
  for (const modelName of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const { response, data } = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // 1. Success Case
    if (response.ok && data.candidates && data.candidates.length > 0) {
      let text = data.candidates[0]?.content?.parts?.[0]?.text;
      
      // Safety Net: Prevents the empty black bubbles from appearing 
      // if Gemini gets confused or safety filters strip the response text.
      if (!text || text.trim() === '') {
         data.candidates[0] = { content: { parts: [{ text: "I'm listening. Please go on." }] } };
      }
      
      return res.status(200).json(data);
    }

    // 2. Hard syntax error (do not retry other models, it's a payload issue)
    if (response.status === 400) {
      return res.status(400).json({ error: data.error?.message || 'Bad Request Format' });
    }

    // 3. Track errors to report if all models fail
    lastErrorMsg = data.error?.message || `Model ${modelName} failed.`;
    lastStatus = response.status || 500;
  }

  // If we exhaust the array and all models are overloaded
  return res.status(lastStatus).json({ error: `High Demand: ${lastErrorMsg}. Please wait a moment and try again.` });
};