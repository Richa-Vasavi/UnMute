module.exports = async (req, res) => {
  // 1. Handle CORS and preflight requests
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY in Vercel' });

  try {
    const { system, messages } = req.body;

    // 2. Safely construct the conversation array
    const conversation = [];
    
    // Inject the system prompt safely to avoid API version conflicts
    if (system) {
      conversation.push({ role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS: ${system}` }] });
      conversation.push({ role: 'model', parts: [{ text: `Understood. I will act as Unmute.` }] });
    }

    // Add the actual chat history
    (messages || []).forEach(m => {
      conversation.push({
        role: (m.role === 'user') ? 'user' : 'model',
        parts: [{ text: m.content || ' ' }]
      });
    });

    // 3. Call the rock-solid v1 stable endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: conversation })
    });

    const data = await response.json();

    // 4. Catch Google rejections
    if (!response.ok) {
       return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    // 5. Safely extract the text and send it back
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm listening.";
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};