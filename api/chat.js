export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { soal, tipe } = body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY belum disetel di Netlify Environment Variables.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let systemPrompt = "Anda adalah asisten pintar pembantu tugas sekolah. Jawab soal dengan jelas dan akurat.";
    if (tipe === 'ai_fill') systemPrompt = "Berikan jawaban ringkas yang siap disalin ke form.";
    if (tipe === 'kkm') systemPrompt = "Berikan jawaban sempurna bernilai tinggi (di atas KKM).";
    if (tipe === 'penjelasan') systemPrompt = "Berikan penjelasan langkah-demi-langkah yang mendetail.";

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: soal }
        ]
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
