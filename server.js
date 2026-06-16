require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_KEY) {
  console.warn('警告：未設定 GOOGLE_API_KEY，請在啟動前設定。');
}

app.use(express.static('.'));

app.post('/api/ai', async (req, res) => {
  const prompt = req.body.prompt || req.body.input || '';

  if (!GOOGLE_KEY) {
    return res.status(500).json({ error: 'No API key configured. Set GOOGLE_API_KEY.' });
  }

  try {
    // 使用 Google Generative Language API (text-bison-001)
    const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${GOOGLE_KEY}`;
    const body = {
      prompt: { text: prompt },
      temperature: 0.2,
      maxOutputTokens: 512
    };

    const resp = await axios.post(url, body, { timeout: 20000 });
    const output = resp.data?.candidates?.[0]?.output || resp.data?.candidates?.[0]?.content || resp.data?.output?.[0]?.content || JSON.stringify(resp.data);
    res.status(resp.status).json({ provider: 'google', raw: resp.data, text: output });

  } catch (err) {
    console.error('代理請求錯誤：', err.toString());
    const status = err.response && err.response.status ? err.response.status : 500;
    const details = err.response && err.response.data ? err.response.data : null;
    res.status(status).json({ error: err.toString(), details });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
});
