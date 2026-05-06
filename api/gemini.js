export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel environment variables.' });
  }

  const { system, messages, max_tokens } = req.body;

  // ✅ Fix 4: Guard against empty/missing messages
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required and cannot be empty.' });
  }

  try {
    const formattedMessages = messages.map(m => ({
      role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    }));

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

    // ✅ Fix 1 & 2: Correct model name + colon before generateContent (not a space)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    // ✅ Fix 3: Extract the actual text from Gemini's response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'No response text returned from Gemini.' });
    }

    res.status(200).json({ text });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}