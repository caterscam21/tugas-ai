exports.handler = async (event, context) => {
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

    // Menggunakan gemini-2.5-flash yang sangat stabil
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Proteksi timeout 8 detik agar tidak hang selamanya
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        }),
        signal: controller.signal
      });
    } catch (err) {
      clearTimeout(timeoutId);
      return {
        statusCode: 504,
        body: JSON.stringify({ error: 'Koneksi ke server Gemini timeout. Silakan coba lagi.' })
      };
    }
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        statusCode: response.status || 500,
        body: JSON.stringify({ error: data.error?.message || 'Gagal memanggil Gemini API' })
      };
    }

    const aiAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, AI tidak memberikan respons.';

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
