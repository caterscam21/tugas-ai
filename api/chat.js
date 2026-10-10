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

    // Daftar model cadangan otomatis (jika yang utama sibuk, pindah ke bawahnya)
    const modelsToTry = [
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash-lite'
    ];

    let data = null;
    let success = false;
    let lastError = '';

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        data = await response.json();

        if (response.ok && !data.error) {
          success = true;
          break; // Berhasil, keluar dari loop
        } else {
          lastError = data.error?.message || `Model ${model} sibuk`;
          continue; // Coba model berikutnya
        }
      } catch (err) {
        lastError = err.message;
        continue;
      }
    }

    if (!success) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Semua model Gemini sedang sibuk. Silakan coba beberapa saat lagi.' })
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
