require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 支援多個後端：若設定 GOOGLE_API_KEY，則使用 Google Generative Language API；
// 否則預設使用原本的 myai168 API（由 MYAI_KEY 提供）。
const REMOTE_API_MYAI = 'https://www.myai168.com/stu/api/openai/v1/responses';
const MYAI_KEY = process.env.MYAI_KEY;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

if (!MYAI_KEY && !GOOGLE_KEY) {
  console.warn('警告：未設定 MYAI_KEY 或 GOOGLE_API_KEY，請在啟動前設定其中一個。');
}

app.use(express.static('.'));

app.post('/api/ai', async (req, res) => {
  const prompt = req.body.prompt || req.body.input || '';

  try {
    if (GOOGLE_KEY) {
      // 使用 Google Generative Language API (text-bison-001)
      const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${GOOGLE_KEY}`;
      const body = {
        prompt: { text: prompt },
        temperature: 0.2,
        maxOutputTokens: 512
      };

      const resp = await axios.post(url, body, { timeout: 20000 });

      // 嘗試擷取常見回傳欄位
      const output = resp.data?.candidates?.[0]?.output || resp.data?.candidates?.[0]?.content || resp.data?.output?.[0]?.content || JSON.stringify(resp.data);
      res.status(resp.status).json({ provider: 'google', raw: resp.data, text: output });

    } else if (MYAI_KEY) {
      // 使用原本的 myai168 代理方式
      const resp = await axios.post(REMOTE_API_MYAI, {
        model: 'gpt-5',
        input: prompt
      }, {
        headers: {
          'Authorization': `Bearer ${MYAI_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      res.status(resp.status).json(resp.data);
    } else {
      res.status(500).json({ error: 'No API key configured (set GOOGLE_API_KEY or MYAI_KEY).' });
    }

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
