import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Утилита для отправки писем через SMTP Mail.ru
 */

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: process.env.EMAIL_PORT || 2525, // Используем обходной порт (или 587)
  secure: false, // false для порта 587/2525, потому что шифрование STARTTLS включится автоматически 
  auth: {
    user: process.env.EMAIL_USER, // Это будет ваш "Login" с сайта Brevo (обычно почта)
    pass: process.env.EMAIL_PASS // Это будет САМЫЙ длинный ключ, который вы сейчас получите
  }
});

export const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"ExploreCity" <${process.env.EMAIL_USER || 'test.kz0101@mail.ru'}>`,
      to,
      subject,
      text,
      html
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    // В режиме разработки не роняем сервер, если почта не настроена
    return null;
  }
};

/**
 * Прокси-функция для обратной совместимости со старым кодом
 */
export const sendMockEmail = async (to, subject, text, html) => {
  return sendEmail(to, subject, text, html);
};
