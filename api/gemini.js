export default async function handler(req, res) {
  const { system, messages } = req.body;

  // 1. Manually insert the system prompt as the first message
  const formattedMessages = [
    {
      role: 'user',
      parts: [{ text: `SYSTEM INSTRUCTIONS: ${system}` }]
    },
    {
      role: 'model',
      parts: [{ text: "Understood. I will act as Unmute and follow those instructions strictly." }]
    },
    // 2. Map the rest of your conversation history
    ...messages.map(m => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
  ];

  try {
    // 3. Use the stable v1 endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: formattedMessages, // No system_instruction field here
        generationConfig: { 
          maxOutputTokens: req.body.max_tokens || 1000,
          temperature: 0.7 
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}export default async function handler(req, res) {
  const { system, messages } = req.body;

  // Gemini expects roles to be 'user' or 'model'
  const formattedMessages = messages.map(m => ({
    role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: formattedMessages,
        generationConfig: { 
          maxOutputTokens: req.body.max_tokens || 1000,
          temperature: 0.7 
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
