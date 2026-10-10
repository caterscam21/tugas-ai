exports.handler = async (event, context) => {
  // Hanya menerima method POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const promptText = body.soal || body.prompt || body.question || body.text || '';

    if (!promptText) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Teks soal tidak boleh kosong.' })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'GEMINI_API_KEY belum dipasang di Netlify!' })
      };
    }

    // Menggunakan endpoint Gemini 1.5 Flash resmi (stabil & gratis)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Menggunakan fetch bawaan Netlify (tidak perlu require node-fetch)
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        statusCode: response.status || 500,
        body: JSON.stringify({ error: data.error?.message || 'Gagal memanggil Gemini API' })
      };
    }

    // Ambil jawaban dari Gemini secara aman
    const aiAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, AI tidak memberikan respons.';

    // Kirim format lengkap agar langsung dibaca oleh index.html
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result: aiAnswer,
        answer: aiAnswer,
        text: aiAnswer,
        choices: [
          {
            text: aiAnswer,
            message: {
              content: aiAnswer
            }
          }
        ]
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
