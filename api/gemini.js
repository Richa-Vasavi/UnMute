module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API Key missing in Vercel' });
  }

  const { system, messages, max_tokens } = req.body;

  const formattedMessages = [];

  // 1. SAFE SYSTEM INJECTION: Pass the instructions as the first chat message
  if (system) {
    formattedMessages.push({ role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS: ${system}` }] });
    formattedMessages.push({ role: 'model', parts: [{ text: "Understood. I will act as Unmute." }] });
  }

  // 2. Add the actual user history
  (messages || []).forEach(m => {
    formattedMessages.push({
      role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.content || ' ' }]
    });
  });

  // 3. CLEAN PAYLOAD: No systemInstruction field to trigger errors
  const payload = {
    contents: formattedMessages,
    generationConfig: { 
      maxOutputTokens: max_tokens || 1000, 
      temperature: 0.7 
    }
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || text.trim() === '') {
       data.candidates = [{ content: { parts: [{ text: "I'm listening. Please go on." }] } }];
    }

    return res.status(200).json(data);
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};