export default async function handler(req, res) {
  // Hanya menerima method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { soal, tipe } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  // Cek ketersediaan API Key di Vercel Environment Variables
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY belum dikonfigurasi di Vercel Environment Variables.' });
  }

  // Menentukan instruksi AI berdasarkan tombol mode yang diklik di index.html
  let systemPrompt = "Anda adalah asisten pintar pembantu tugas sekolah/kuliah. Jawab soal dengan jelas, akurat, dan langsung pada intinya.";

  switch (tipe) {
    case 'jawab':
      systemPrompt = "Berikan jawaban langsung dan akurat untuk soal-soal berikut tanpa basa-basi.";
      break;
    case 'ai_fill':
      systemPrompt = "Berikan jawaban ringkas dan singkat yang siap langsung disalin-tempel (copy-paste) ke dalam kolom isian form.";
      break;
    case 'kkm':
      systemPrompt = "Jawab soal berikut dengan jawaban sempurna bernilai maksimal (di atas KKM), beserta alasan singkatnya.";
      break;
    case 'penjelasan':
      systemPrompt = "Jawab soal berikut dan sertakan penjelasan langkah-demi-langkah (step-by-step) yang sangat mendetail.";
      break;
    case 'scan':
      systemPrompt = "Analisis teks hasil scan dari layar berikut, rapikan jika ada typo/salah baca, lalu berikan kuncinya.";
      break;
    case 'tutor':
      systemPrompt = "Bertindaklah sebagai tutor/guru ramah. Jelaskan konsep dasar dibalik soal ini agar siswa paham cara mengerjakannya.";
      break;
    case 'tanya':
      systemPrompt = "Jawab pertanyaan pengguna dengan komunikatif dan mudah dipahami.";
      break;
    case 'cek':
      systemPrompt = "Periksa jawaban atau soal berikut. Tentukan apakah ada yang salah/keliru dan berikan koreksinya.";
      break;
    case 'ringkas':
      systemPrompt = "Buat ringkasan/poin-poin penting secara sistematis dari materi/soal berikut.";
      break;
    default:
      systemPrompt = "Berikan jawaban terbaik dan akurat untuk soal berikut.";
  }

  try {
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

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gagal merespons dari OpenAI' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
