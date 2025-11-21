import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = 'https://1plat.cash/api/merchant/order/create/by-api';
const X_SHOP = process.env.X_SHOP;
const X_SECRET = process.env.X_SECRET;

app.get('/pay/:amount/:userId', async (req, res) => {
  const { amount, userId } = req.params;

  try {
    const url = await createOrder({ amount, userId });
    res.redirect(302, url); // 🔁 автоматичний перехід на сторінку оплати
  } catch (error) {
    res.status(500).send(`Помилка: ${error.message}`);
  }
});

async function createOrder({ amount, userId }) {
  const body = {
    merchant_order_id: `archivchik_${userId}_${amount}`,
    user_id: Number(userId),
    amount: Number(amount),
    email: `${userId}@temp.com`,
    method: 'card'
  };

  console.log('🔼 Запит до API:', body);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shop': X_SHOP,
        'X-Secret': X_SECRET
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    console.log('🔽 Відповідь API:', JSON.stringify(result, null, 2));

    if (result.success === 1 && result.url && result.url.startsWith('http')) {
      return result.url;
    } else {
      throw new Error(`API error: ${JSON.stringify(result)}`);
    }

  } catch (error) {
    console.error('❌ Помилка при запиті до API:', error);
    throw new Error('API error');
  }
}

app.listen(PORT, () => {
  console.log(`✅ Сервер працює на порту ${PORT}`);
});