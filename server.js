require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const REMOTE_API = 'https://www.myai168.com/stu/api/openai/v1/responses';
const API_KEY = process.env.MYAI_KEY;

if (!API_KEY) {
  console.warn('警告：未設定 MYAI_KEY 環境變數，請在啟動前設定。');
}

app.post('/api/ai', async (req, res) => {
  const prompt = req.body.prompt || req.body.input || '';
  try {
    const resp = await axios.post(REMOTE_API, {
      model: 'gpt-5',
      input: prompt
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });

    res.status(resp.status).json(resp.data);
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
