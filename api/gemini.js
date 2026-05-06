export default async function handler(req, res) {
  const { system, messages } = req.body;

  // Gemini expects roles to be 'user' or 'model'
  // We prepend the system instructions to the first message for v1 stability
  const formattedMessages = [
    {
      role: 'user',
      parts: [{ text: `SYSTEM INSTRUCTIONS: ${system}` }]
    },
    {
      role: 'model',
      parts: [{ text: "Understood. I will follow these instructions strictly." }]
    },
    ...messages.map(m => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
  ];

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
