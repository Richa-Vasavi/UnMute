// 1. The new Retry Logic function sits at the top
async function fetchWithRetry(url, options, retries = 3, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    const data = await response.json();

    // If Google says 503 or "high demand", wait and try again
    if (response.status === 503 || data.error?.message?.includes('high demand')) {
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1))); // Waits 2s, then 4s, etc.
        continue; // Loops back to try again
      }
    }
    // If it succeeds (or fails for a different reason), return the data
    return { response, data };
  }
}

// 2. Your standard Vercel Handler
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API Key missing in Vercel' });
  }

  const { system, messages, max_tokens } = req.body;

  const formattedMessages = messages.map(m => ({
    role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
    parts: [{ text: m.content || '' }]
  }));

  const payload = {
    system_instruction: { parts: [{ text: system || "You are a helpful assistant." }] },
    contents: formattedMessages,
    generationConfig: { maxOutputTokens: max_tokens || 1000, temperature: 0.7 }
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // 3. We use the new fetchWithRetry function here instead of standard fetch
    const { response, data } = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};