module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API Key missing in Vercel settings.' });
  }

  const { system, messages, max_tokens } = req.body;

  // Format messages strictly to 'user' or 'model'
  const formattedMessages = (messages || []).map(m => ({
    role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
    parts: [{ text: m.content || ' ' }]
  }));

  // EXACT Google API payload structure (Note the camelCase systemInstruction)
  const payload = {
    systemInstruction: { parts: [{ text: system || "You are a helpful assistant." }] },
    contents: formattedMessages,
    generationConfig: { maxOutputTokens: max_tokens || 1000, temperature: 0.7 }
  };

  try {
    // Direct connection to the stable 'latest' alias
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // If Google rejects the request, display exactly why without looping
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    // Safety Net: If Gemini's safety filters strip the response text, prevent a UI crash
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || text.trim() === '') {
       data.candidates = [{ content: { parts: [{ text: "I'm listening. Please go on." }] } }];
    }

    return res.status(200).json(data);
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};