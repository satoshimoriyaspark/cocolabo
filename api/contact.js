function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  const name = clean(body.name, 80);
  const email = clean(body.email, 254);
  const tel = clean(body.tel, 40);
  const category = clean(body.category, 80) || 'その他';
  const message = clean(body.message, 5000);
  const website = clean(body.website, 200);

  // Honeypot: pretend success so automated spam does not learn anything.
  if (website) return res.status(200).json({ ok: true });

  if (!name || !validEmail(email) || !message) {
    return res.status(400).json({ error: '必須項目をご確認ください。' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.CONTACT_TO || 'info@coco-labo.net';

  if (!apiKey || !from) {
    return res.status(503).json({ error: '現在フォーム送信の準備中です。お急ぎの場合は info@coco-labo.net へご連絡ください。' });
  }

  const text = [
    'ココロエデュケーションラボ Webサイトからお問い合わせが届きました。',
    '',
    'お名前: ' + name,
    'メール: ' + email,
    '電話番号: ' + (tel || '未入力'),
    'お問い合わせ種別: ' + category,
    '',
    'お問い合わせ内容:',
    message
  ].join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: '【ココラボ】お問い合わせ：' + category,
        text
      })
    });

    if (!response.ok) {
      const providerError = await response.text();
      console.error('Resend error', response.status, providerError.slice(0, 500));
      return res.status(502).json({ error: '送信に失敗しました。時間をおいて再度お試しください。' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact form send error', error && error.message ? error.message : error);
    return res.status(500).json({ error: '送信に失敗しました。時間をおいて再度お試しください。' });
  }
};
