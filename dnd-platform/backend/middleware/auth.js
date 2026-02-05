// backend/middleware/auth.js
const jwt = require('jsonwebtoken')

module.exports = function(req, res, next) {
  console.log('\n=== AUTH MIDDLEWARE ===')
  console.log('Path:', req.path)
  console.log('Method:', req.method)
  console.log('Authorization header:', req.headers['authorization'])
  
  // Публичные маршруты
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register', 
    '/api/characters/data/classes',
    '/api/characters/data/races'
  ]
  
  // // Также делаем публичными маршруты которые не требуют авторизации
  if (req.path.startsWith('/api/characters/data/')) {
    console.log('Public data route, skipping auth')
    return next()
  }
  
  if (publicRoutes.includes(req.path)) {
    console.log('Public route, skipping auth')
    return next()
  }

  const authHeader = req.headers['authorization']
  
  if (!authHeader) {
    console.log('❌ No authorization header')
    return res.status(401).json({ 
      error: 'Требуется авторизация',
      code: 'NO_TOKEN'
    })
  }

  const token = authHeader.split(' ')[1]
  
  if (!token) {
    console.log('❌ No token in header')
    return res.status(401).json({ 
      error: 'Неверный формат токена',
      code: 'INVALID_TOKEN_FORMAT'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    console.log('✅ Token verified, decoded:', decoded)
    
    // Важное исправление: создаем единую структуру пользователя
    const userId = decoded.userId || decoded.id
    
    if (!userId) {
      console.log('❌ No user ID in token')
      return res.status(401).json({ 
        error: 'Неверный токен',
        code: 'INVALID_TOKEN'
      })
    }
    
    req.user = {
      ...decoded,
      userId: userId,
      id: userId // Для совместимости с кодом, который использует req.user.id
    }
    
    console.log('✅ User set:', { userId: req.user.userId, id: req.user.id })
    
    next()
  } catch (error) {
    console.error('❌ Token verification error:', error.message)
    
    let errorMessage = 'Недействительный токен'
    let code = 'INVALID_TOKEN'
    
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Срок действия токена истек'
      code = 'TOKEN_EXPIRED'
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Неверный токен'
      code = 'JWT_ERROR'
    }
    
    return res.status(403).json({ 
      error: errorMessage,
      code: code
    })
  }
}