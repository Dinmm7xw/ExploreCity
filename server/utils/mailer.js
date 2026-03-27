import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Утилита для отправки писем через SMTP Mail.ru
 */

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true, // true для 465, false для других портов
  auth: {
    user: process.env.EMAIL_USER || 'test.kz0101@mail.ru',
    pass: process.env.EMAIL_PASS // Пароль из .env
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
