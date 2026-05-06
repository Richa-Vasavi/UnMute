export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel environment variables.' });
  }

  const { system, messages, max_tokens } = req.body;

  try {
    // 1. Format the conversation history for Gemini (roles must be 'user' or 'model')
    const formattedMessages = messages.map(m => ({
      role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    }));

    // 2. Build the exact payload structure required by v1beta
    const payload = {
      system_instruction: {
        parts: [{ text: system || "You are a helpful assistant." }]
      },
      contents: formattedMessages,
      generationConfig: { 
        maxOutputTokens: max_tokens || 1000,
        temperature: 0.7 
      }
    };

    // 3. Call the correct v1beta endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // 4. Handle API-side errors gracefully
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    // 5. Send success data back to frontend
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
