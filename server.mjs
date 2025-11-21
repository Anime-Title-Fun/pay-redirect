import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = 'https://1plat.cash/api/merchant/order/create/by-api';
const X_SHOP = (process.env.X_SHOP || '').trim();
const X_SECRET = (process.env.X_SECRET || '').trim();

// ✅ 1. Маршрут здоров’я
app.get('/', (req, res) => {
  res.json({
    ok: true,
    env: {
      X_SHOP: X_SHOP ? 'set' : 'missing',
      X_SECRET: X_SECRET ? 'set' : 'missing',
      PORT
    }
  });
});

// ✅ 2. Основний редирект
app.get('/pay/:amount/:userId', async (req, res) => {
  const { amount, userId } = req.params;
  try {
    const url = await createOrder({ amount, userId });
    res.redirect(302, url);
  } catch (error) {
    res.status(500).send(`Помилка: ${error.message}`);
  }
});

// ✅ 3. Дебаг‑маршрут (JSON‑відповідь)
app.get('/debug/:amount/:userId', async (req, res) => {
  const { amount, userId } = req.params;
  try {
    const result = await createOrderRaw({ amount, userId });
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
});

// 🔧 Функція створення замовлення
async function createOrder({ amount, userId }) {
  const result = await createOrderRaw({ amount, userId });
  if (result?.url?.startsWith('http')) return result.url;
  if (result?.error) throw new Error(`API error: ${result.error}`);
  throw new Error(`API error: ${JSON.stringify(result)}`);
}

// 🔍 Функція запиту до API
async function createOrderRaw({ amount, userId }) {
  const body = {
    merchant_order_id: `archivchik_${userId}_${amount}`,
    user_id: Number(userId),
    amount: Number(amount),
    email: `${userId}@temp.com`,
    method: 'card'
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-Shop': X_SHOP,
    'X-Secret': X_SECRET
  };

  console.log('🔼 Запит до API:', JSON.stringify({ body, headers: { ...headers, 'X-Secret': '***' } }, null, 2));

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch {
    console.error('⚠️ API повернув не-JSON:', text);
    throw new Error(`API non-JSON: ${text}`);
  }

  console.log('🔽 Відповідь API:', JSON.stringify(json, null, 2), 'status=', response.status);
  return json;
}

// 🔊 Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер працює на порту ${PORT}`);
});
