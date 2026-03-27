import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'explorecity_super_secret_key_123';

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Необходима авторизация (токен отсутствует)' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Неверный или просроченный токен' });
  }
};

export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'У вас нет прав администратора' });
    }
    next();
  });
};
