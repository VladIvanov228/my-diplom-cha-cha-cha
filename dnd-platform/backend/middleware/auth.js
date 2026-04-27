const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  console.log('\n=== AUTH MIDDLEWARE ===');
  console.log('Path:', req.path);
  console.log('Method:', req.method);
  console.log('Authorization header:', req.headers['authorization'] ? 'Present' : 'Missing');
  
  // Публичные маршруты
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/spells',
    '/api/monsters',
    '/api/skills'
  ];
  
  // Проверяем, является ли маршрут публичным
  // 1. Точное совпадение с publicRoutes
  if (publicRoutes.includes(req.path)) {
    console.log('✅ Public route (exact match), skipping auth');
    return next();
  }
  
  // 2. Любой маршрут, начинающийся с /api/characters/data/ (для классов, рас, фонов)
  if (req.path.startsWith('/api/characters/data/')) {
    console.log('✅ Public data route, skipping auth');
    return next();
  }

  // 3. Для отладки - выводим все непубличные маршруты
  console.log('🔒 Protected route - checking token...');

  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    console.log('❌ No authorization header');
    return res.status(401).json({ 
      error: 'Требуется авторизация',
      code: 'NO_TOKEN'
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.log('❌ No token in header');
    return res.status(401).json({ 
      error: 'Неверный формат токена',
      code: 'INVALID_TOKEN_FORMAT'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token verified, userId:', decoded.userId || decoded.id);
    
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      console.log('❌ No user ID in token');
      return res.status(401).json({ 
        error: 'Неверный токен',
        code: 'INVALID_TOKEN'
      });
    }
    
    req.user = {
      ...decoded,
      userId: userId,
      id: userId
    };
    
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    
    let errorMessage = 'Недействительный токен';
    let code = 'INVALID_TOKEN';
    
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Срок действия токена истек';
      code = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Неверный токен';
      code = 'JWT_ERROR';
    }
    
    return res.status(403).json({ 
      error: errorMessage,
      code: code
    });
  }
}

// Дополнительные полезные функции
function generateToken(user) {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      email: user.email,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId || decoded.id;
        req.user = { ...decoded, userId, id: userId };
      } catch (error) {
        // Игнорируем ошибки - пользователь просто не будет авторизован
      }
    }
  }
  
  next();
}

// Экспортируем основную функцию как default и именованные экспорты
module.exports = authenticateToken;
module.exports.optionalAuth = optionalAuth;
module.exports.generateToken = generateToken;