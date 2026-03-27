import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

// Настройка подключения к PostgreSQL
const pool = new Pool(
  process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Требуется для облачных БД (Neon)
      }
    : {
        user: 'postgres',
        host: 'localhost',
        database: 'explorecity', 
        password: '1234',
        port: 5432,
      }
);

export const initDb = async () => {
  try {
    // 1. Создание таблиц, если их нет
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user'
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        date VARCHAR(50),
        time VARCHAR(50),
        location VARCHAR(255),
        city VARCHAR(100),
        category VARCHAR(100),
        image_url TEXT,
        rating NUMERIC(3,1) DEFAULT 0.0,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS saved_events (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, event_id)
      );

      CREATE TABLE IF NOT EXISTS event_registrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        tickets INTEGER DEFAULT 1,
        seats TEXT,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Миграции (добавление новых колонок в существующие таблицы)
    // Добавляем category, если ее нет
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='category') THEN 
          ALTER TABLE events ADD COLUMN category VARCHAR(100); 
        END IF; 
      END $$;
    `);

    // Добавляем rating, если его нет
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='rating') THEN 
          ALTER TABLE events ADD COLUMN rating NUMERIC(3,1) DEFAULT 0.0; 
        END IF; 
      END $$;
    `);

    // Добавляем author_id, если его нет
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='author_id') THEN 
          ALTER TABLE events ADD COLUMN author_id INTEGER REFERENCES users(id) ON DELETE CASCADE; 
        END IF; 
      END $$;
    `);

    // Добавляем seats в event_registrations, если его нет
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_registrations' AND column_name='seats') THEN 
          ALTER TABLE event_registrations ADD COLUMN seats TEXT; 
        END IF; 
      END $$;
    `);

    // Добавляем phone в event_registrations, если его нет
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_registrations' AND column_name='phone') THEN 
          ALTER TABLE event_registrations ADD COLUMN phone VARCHAR(20); 
        END IF; 
      END $$;
    `);

    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_registrations' AND column_name='status') THEN
          ALTER TABLE event_registrations ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        END IF;
      END $$;
    `);

    // Миграция для восстановления пароля
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token') THEN
          ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token_expiry') THEN
          ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
        END IF;
      END $$;
    `);

    // Миграция для координат (Задача 3)
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='latitude') THEN
          ALTER TABLE events ADD COLUMN latitude DECIMAL(10, 8);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='longitude') THEN
          ALTER TABLE events ADD COLUMN longitude DECIMAL(11, 8);
        END IF;
      END $$;
      
      -- Проставляем координаты по умолчанию для старых записей (центр Алматы)
      UPDATE events SET latitude = 43.238949, longitude = 76.889709 WHERE latitude IS NULL;
    `);

    // Создание таблицы отзывов (Задача 4)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('PostgreSQL (pgAdmin) Database tables initialized and migrated successfully.');

    // Добавление тестовых данных
    const result = await pool.query('SELECT COUNT(*) FROM events');
    const count = parseInt(result.rows[0].count, 10);

    if (count === 0) {
      console.log('No events found, inserting sample PostgreSQL data...');
      await pool.query(`
        INSERT INTO events (title, description, date, time, location, city, category, image_url, rating) VALUES 
        ('Концерт Димаша Кудайбергена', 'Грандиозный сольный концерт мировой звезды с новой программой.', '2026-05-10', '19:00', 'Дворец Республики (Достык 56)', 'Almaty', 'Концерт', 'https://picsum.photos/800/400?random=1', 5.0),
        ('Выставка современного искусства', 'Экспозиция картин молодых художников Казахстана и Центральной Азии.', '2026-06-01', '10:00', 'Astana EXPO', 'Astana', 'Выставка', 'https://picsum.photos/800/400?random=2', 4.8),
        ('Фестиваль Еды "Сарқыт"', 'Лучшая национальная кухня, гастрономические шедевры и мастер-классы.', '2026-07-15', '12:00', 'Парк Абая', 'Shymkent', 'Фестиваль', 'https://picsum.photos/800/400?random=3', 4.9)
      `);
      console.log('Sample data correctly inserted into PostgreSQL.');
    }
  } catch (error) {
    console.error('Data initialization error:', error);
  }
};

export default pool;
