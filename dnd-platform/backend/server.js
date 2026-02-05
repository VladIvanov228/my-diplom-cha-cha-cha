const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const { pool } = require('./db');

// Import auth middleware
const authMiddleware = require('./middleware/auth');

// Проверка подключения к БД при старте
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Простая главная страница с информацией об API
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>D&D Platform API</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: white;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        h1 {
          color: #fff;
          text-align: center;
          margin-bottom: 30px;
          font-size: 2.5em;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .endpoint {
          background: rgba(255, 255, 255, 0.15);
          padding: 15px;
          margin: 10px 0;
          border-radius: 8px;
          border-left: 4px solid #42b983;
        }
        .method {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          margin-right: 10px;
          font-size: 0.9em;
        }
        .get { background: #61affe; }
        .post { background: #49cc90; }
        .put { background: #fca130; }
        .delete { background: #f93e3e; }
        .path { color: #ffd700; font-family: monospace; }
        .status {
          display: inline-block;
          background: rgba(0,0,0,0.3);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.8em;
          margin-left: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎲 D&D Platform API</h1>
        <p>Сервер для онлайн-платформы Dungeons & Dragons</p>
        
        <h2>📡 Доступные эндпоинты:</h2>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <span class="path">/api/auth/test</span>
          <span class="status">Public</span>
          <p>Тестовый эндпоинт аутентификации</p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <span class="path">/api/auth/register</span>
          <span class="status">Public</span>
          <p>Регистрация нового пользователя</p>
        </div>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <span class="path">/api/auth/login</span>
          <span class="status">Public</span>
          <p>Вход в систему</p>
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <span class="path">/api/characters</span>
          <span class="status">Private</span>
          <p>Получить персонажей пользователя</p>
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <span class="path">/api/spells</span>
          <span class="status">Public</span>
          <p>Получить список заклинаний</p>
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <span class="path">/api/monsters</span>
          <span class="status">Public</span>
          <p>Получить список монстров</p>
        </div>
        
        <h2>🔗 Frontend</h2>
        <p>Интерфейс доступен по адресу: <a href="http://localhost:5173" style="color: #ffd700;">http://localhost:5173</a></p>
        
        <h2>⚙️ Технологии</h2>
        <ul>
          <li>Node.js + Express</li>
          <li>PostgreSQL</li>
          <li>Vue.js 3 (фронтенд)</li>
          <li>Socket.io (реальное время)</li>
        </ul>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
          <p>🔄 Перезапустите сервер для применения изменений</p>
          <p>📚 <a href="https://github.com/" style="color: #ffd700;">Документация API</a></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Routes with authentication
app.use('/api/auth', require('./routes/auth'));
app.use('/api/characters', authMiddleware, require('./routes/characters'));
app.use('/api/campaigns', authMiddleware, require('./routes/campaigns'));
app.use('/api/spells', require('./routes/spells'));
app.use('/api/monsters', require('./routes/monsters'));
app.use('/api/maps', authMiddleware, require('./routes/maps'));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Socket.io для реального времени
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-campaign', (campaignId) => {
    socket.join(`campaign-${campaignId}`);
    console.log(`User ${socket.id} joined campaign ${campaignId}`);
  });

  socket.on('send-message', (data) => {
    io.to(`campaign-${data.campaignId}`).emit('new-message', data);
  });

  socket.on('update-character', (data) => {
    io.to(`campaign-${data.campaignId}`).emit('character-updated', data);
  });

  socket.on('roll-dice', (data) => {
    io.to(`campaign-${data.campaignId}`).emit('dice-rolled', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  console.log('Body:', req.body)
  console.log('Headers:', req.headers)
  next()
})
// Глобальная обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Database: ${process.env.DB_NAME}`);
  console.log(`🔗 Socket.io ready`);
  console.log(`🔐 Authentication middleware enabled for protected routes`);
});