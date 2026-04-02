import express from 'express';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { sendMockEmail } from '../utils/mailer.js';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const { city } = req.query;

    const result = await pool.query('SELECT * FROM events');
    let events = result.rows;

    const sessionsRes = await pool.query('SELECT * FROM event_sessions');
    const allSessions = sessionsRes.rows;

    events = events.map(ev => ({
      ...ev,
      sessions: allSessions.filter(s => s.event_id === ev.id)
    }));

    if (city && city !== 'All') {
      events = events.filter(ev => ev.city === city || ev.sessions.some(s => s.city === city));
    }

    res.json(events || []);
  } catch (error) {
    console.error('Get Events Error:', error);
    res.status(500).json({ message: 'Ошибка получения мероприятий' });
  }
});


router.get('/tickets', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id as event_id, e.title, e.date, e.time, e.location, e.city, e.image_url, 
              r.id as ticket_id, r.tickets as ticket_count, r.seats, r.created_at, r.status,
              s.date as session_date, s.time as session_time, s.location as session_location, s.city as session_city
       FROM events e 
       JOIN event_registrations r ON e.id = r.event_id 
       LEFT JOIN event_sessions s ON r.session_id = s.id
       WHERE r.user_id = $1 AND r.status = 'active'
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get Tickets Error:', error);
    res.status(500).json({ message: 'Ошибка получения билетов' });
  }
});


router.get('/saved', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.* FROM events e 
       JOIN saved_events s ON e.id = s.event_id 
       WHERE s.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get Saved Events Error:', error);
    res.status(500).json({ message: 'Ошибка получения сохраненных мероприятий' });
  }
});


router.get('/my', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE author_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get My Events Error:', error);
    res.status(500).json({ message: 'Ошибка получения моих мероприятий' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    const event = result.rows[0];

    if (!event) return res.status(404).json({ message: 'Мероприятие не найдено' });


    const sessionsRes = await pool.query('SELECT * FROM event_sessions WHERE event_id = $1 ORDER BY date, time', [req.params.id]);
    event.sessions = sessionsRes.rows;

    res.json(event);
  } catch (error) {
    console.error('Get Event Error:', error);
    res.status(500).json({ message: 'Ошибка получения мероприятия' });
  }
});


router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, description, date, time, location, city, category, image_url, rating, latitude, longitude, sessions, price } = req.body;
    
    // Set default price if not provided
    const eventPrice = price !== undefined ? price : 5000;

    const result = await pool.query(
      'INSERT INTO events (title, description, date, time, location, city, category, image_url, author_id, rating, latitude, longitude, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id',
      [title, description, date, time, location, city, category, image_url, req.user.id, rating || 5.0, latitude || null, longitude || null, eventPrice]
    );

    const eventId = result.rows[0].id;

    if (sessions && Array.isArray(sessions) && sessions.length > 0) {
      for (let session of sessions) {
        await pool.query(
          'INSERT INTO event_sessions (event_id, city, location, date, time, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [eventId, session.city, session.location, session.date, session.time, session.latitude || null, session.longitude || null]
        );
      }
    }

    res.status(201).json({ message: 'Мероприятие создано', id: eventId });
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ message: 'Ошибка создания мероприятия' });
  }
});


router.put('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    const event = result.rows[0];

    if (!event) return res.status(404).json({ message: 'Мероприятие не найдено' });

    if (event.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет доступа к редактированию' });
    }

    const { title, description, date, time, location, city, category, image_url, latitude, longitude, sessions, price } = req.body;

    await pool.query(
      'UPDATE events SET title = $1, description = $2, date = $3, time = $4, location = $5, city = $6, category = $7, image_url = $8, latitude = $9, longitude = $10, price = $11 WHERE id = $12',
      [title, description, date, time, location, city, category, image_url, latitude || null, longitude || null, price || 5000, req.params.id]
    );

    if (sessions && Array.isArray(sessions)) {
      await pool.query('DELETE FROM event_sessions WHERE event_id = $1', [req.params.id]);
      for (let session of sessions) {
        await pool.query(
          'INSERT INTO event_sessions (event_id, city, location, date, time, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [req.params.id, session.city, session.location, session.date, session.time, session.latitude || null, session.longitude || null]
        );
      }
    }

    res.json({ message: 'Мероприятие обновлено' });
  } catch (error) {
    console.error('Update Event Error:', error);
    res.status(500).json({ message: 'Ошибка обновления мероприятия' });
  }
});


router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    const event = result.rows[0];

    if (!event) return res.status(404).json({ message: 'Мероприятие не найдено' });

    if (event.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет доступа к удалению' });
    }

    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ message: 'Мероприятие удалено' });
  } catch (error) {
    console.error('Delete Event Error:', error);
    res.status(500).json({ message: 'Ошибка удаления мероприятия' });
  }
});


router.post('/:id/save', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const exists = await pool.query('SELECT * FROM saved_events WHERE user_id = $1 AND event_id = $2', [userId, eventId]);

    if (exists.rows.length > 0) {
      await pool.query('DELETE FROM saved_events WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
      res.json({ saved: false, message: 'Удалено из сохраненных' });
    } else {
      await pool.query('INSERT INTO saved_events (user_id, event_id) VALUES ($1, $2)', [userId, eventId]);
      res.json({ saved: true, message: 'Добавлено в сохраненные' });
    }
  } catch (error) {
    console.error('Save Event error:', error);
    res.status(500).json({ message: 'Ошибка функции сохранения' });
  }
});


router.post('/:id/register', requireAuth, async (req, res) => {
  try {
    const { tickets, phone, seats, session_id } = req.body;

    const result = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Мероприятие не найдено' });

    await pool.query(
      'INSERT INTO event_registrations (user_id, event_id, tickets, phone, seats, session_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, req.params.id, tickets || 1, phone || '', seats || '', session_id || null]
    );


    const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
    const event = result.rows[0];
    const user = userResult.rows[0];

    sendMockEmail(
      user.email,
      'Ваш билет в ExploreCity!',
      `Поздравляем, ${user.name}! Вы успешно приобрели билет на "${event.title}" (${event.date} в ${event.time}). 
      Места: ${seats || 'Общий вход'}. 
      Ждем вас по адресу: ${event.location}, ${event.city}.`
    );

    res.status(201).json({ message: 'Вы успешно зарегистрированы на мероприятие!' });
  } catch (error) {
    console.error('Register Event Error:', error);
    res.status(500).json({ message: 'Ошибка регистрации' });
  }
});


router.get('/check/validate', async (req, res) => {
  try {
    const { id, user } = req.query;

    const result = await pool.query(
      `SELECT e.title, e.date, e.time, e.location, e.city, u.name as user_name, r.status, r.tickets,
              s.date as session_date, s.time as session_time, s.location as session_location, s.city as session_city
       FROM event_registrations r
       JOIN events e ON r.event_id = e.id
       LEFT JOIN event_sessions s ON r.session_id = s.id
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [id, user]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, message: 'Билет не найден' });
    }

    const ticket = result.rows[0];
    res.json({
      valid: ticket.status === 'active',
      details: ticket
    });
  } catch (error) {
    console.error('Check Ticket Error:', error);
    res.status(500).json({ message: 'Ошибка сервера при проверке билета' });
  }
});


router.get('/admin/refunds', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id as ticket_id, r.tickets as ticket_count, r.status, r.created_at, 
              u.name as user_name, u.email as user_email, e.title as event_title, e.date
       FROM event_registrations r
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       WHERE r.status = 'refunded'
       ORDER BY r.created_at ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get Admin Refunds Error:', error);
    res.status(500).json({ message: 'Ошибка получения запросов на возврат' });
  }
});


router.post('/admin/refunds/:id/action', requireAdmin, async (req, res) => {
  try {
    const { action } = req.body;
    const ticketId = req.params.id;

    if (action === 'approve') {

      const result = await pool.query(
        'UPDATE event_registrations SET status = $1 WHERE id = $2 RETURNING *',
        ['cancelled', ticketId]
      );

      const ticket = result.rows[0];
      const userRes = await pool.query('SELECT email, name FROM users WHERE id = $1', [ticket.user_id]);
      const user = userRes.rows[0];

      sendMockEmail(
        user.email,
        'Возврат одобрен - ExploreCity',
        `Здравствуйте, ${user.name}! Ваш запрос на возврат билета №${ticketId} одобрен. Средства возвращены на ваш счет.`
      );

      res.json({ message: 'Возврат одобрен' });
    } else {

      const result = await pool.query(
        'UPDATE event_registrations SET status = $1 WHERE id = $2 RETURNING *',
        ['active', ticketId]
      );

      const ticket = result.rows[0];
      const userRes = await pool.query('SELECT email, name FROM users WHERE id = $1', [ticket.user_id]);
      const user = userRes.rows[0];

      sendMockEmail(
        user.email,
        'Отказ в возврате - ExploreCity',
        `Здравствуйте, ${user.name}! К сожалению, ваш запрос на возврат билета №${ticketId} был отклонен администратором.`
      );

      res.json({ message: 'Возврат отклонен' });
    }
  } catch (error) {
    console.error('Process Refund Error:', error);
    res.status(500).json({ message: 'Ошибка при обработке возврата' });
  }
});


router.get('/:id/reviews', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.event_id = $1 
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get Reviews Error:', error);
    res.status(500).json({ message: 'Ошибка получения отзывов' });
  }
});


router.post('/:id/reviews', requireAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const eventId = req.params.id;
    const userId = req.user.id;


    await pool.query(
      'INSERT INTO reviews (user_id, event_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [userId, eventId, rating, comment]
    );


    const avgResult = await pool.query(
      'SELECT AVG(rating) as average FROM reviews WHERE event_id = $1',
      [eventId]
    );
    const newAverage = parseFloat(avgResult.rows[0].average).toFixed(1);

    await pool.query(
      'UPDATE events SET rating = $1 WHERE id = $2',
      [newAverage, eventId]
    );

    res.status(201).json({ message: 'Отзыв добавлен', newRating: newAverage });
  } catch (error) {
    console.error('Add Review Error:', error);
    res.status(500).json({ message: 'Ошибка при добавлении отзыва' });
  }
});

export default router;
