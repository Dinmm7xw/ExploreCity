import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);


app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1 style="color: #c17b4c;">ExploreCity Backend API</h1>
      <p>Сервер запущен и готов к работе на порту 5000.</p>
      <p>Используйте <b>http://localhost:3000</b> для доступа к веб-интерфейсу.</p>
      <div style="margin-top: 20px; font-size: 14px; color: #888;">
        Status: Online | DB: PostgreSQL
      </div>
    </div>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ExploreCity Server API is running' });
});


app.use((req, res) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
