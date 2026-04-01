import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';
import { sendEmail, sendMockEmail } from '../utils/mailer.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;


    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ message: 'Пользователь уже существует' });


    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, hashedPassword]
    );

    const user = newUser.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'explorecity_super_secret_key_123', { expiresIn: '1d' });

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;


    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ message: 'Неверный email или пароль' });


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Неверный email или пароль' });


    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'explorecity_super_secret_key_123', { expiresIn: '1d' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});


router.post('/tickets/:id/refund', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Неавторизован' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'explorecity_super_secret_key_123');


    const result = await pool.query(
      'UPDATE event_registrations SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      ['refunded', ticketId, decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Билет не найден или не принадлежит вам' });
    }

    const ticket = result.rows[0];


    const userRes = await pool.query('SELECT email, name FROM users WHERE id = $1', [decoded.id]);
    const user = userRes.rows[0];


    sendMockEmail(
      user.email,
      'Возврат билета в ExploreCity',
      `Здравствуйте, ${user.name}! Ваш запрос на возврат билета №${ticketId} принят. Средства будут возвращены на вашу карту в течение 3-5 рабочих дней.`
    );

    res.json({ message: 'Возврат успешно оформлен', ticket: result.rows[0] });
  } catch (error) {
    console.error('Refund Error:', error);
    res.status(500).json({ message: 'Ошибка сервера при оформлении возврата' });
  }
});



router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {

      return res.json({ message: 'Если этот email зарегистрирован, ссылка придет на него.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000);

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [token, expiry, email]
    );

    const clientUrl = req.headers.origin || process.env.VITE_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;



    sendEmail(
      email,
      'Восстановление пароля - ExploreCity',
      `Для сброса пароля перейдите по ссылке: ${resetUrl}`,
      `<h2>Восстановление пароля</h2>
       <p>Вы получили это письмо, потому что запросили сброс пароля для вашего аккаунта в ExploreCity.</p>
       <p><a href="${resetUrl}" style="background: #c17b4c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Сбросить пароль</a></p>
       <p>Ссылка действительна в течение одного часа.</p>`
    ).catch(err => console.error('Background email error:', err));

    res.json({
      message: 'Ссылка для восстановления отправлена на почту.',


      testUrl: resetUrl
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Токен недействителен или истек.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.rows[0].id]
    );

    res.json({ message: 'Пароль успешно обновлен!' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
