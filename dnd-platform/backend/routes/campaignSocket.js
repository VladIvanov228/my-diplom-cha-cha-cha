const diceRoller = require('../utils/diceRoller');
const { pool } = require('../db');

module.exports = (io) => {
  const campaignRooms = new Map(); // campaignId -> Set of socketIds
  
  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    
    if (!userId) {
      console.log('No user ID, disconnecting socket');
      socket.disconnect();
      return;
    }
    
    console.log(`User ${userId} connected to campaign socket`);
    
    // Присоединение к кампании
    socket.on('join-campaign', async (campaignId) => {
      try {
        console.log(`User ${userId} attempting to join campaign ${campaignId}`);
        
        // Проверяем доступ к кампании
        const hasAccess = await checkCampaignAccess(campaignId, userId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to campaign' });
          return;
        }
        
        socket.join(`campaign:${campaignId}`);
        
        // Сохраняем состояние
        if (!campaignRooms.has(campaignId)) {
          campaignRooms.set(campaignId, new Set());
        }
        campaignRooms.get(campaignId).add(socket.id);
        
        // Уведомляем других о подключении
        socket.to(`campaign:${campaignId}`).emit('player-joined', {
          userId,
          socketId: socket.id,
          timestamp: new Date()
        });
        
        // Получаем последние сообщения
        const messages = await getRecentMessages(campaignId);
        socket.emit('recent-messages', messages);
        
        // Получаем данные карты
        const mapData = await getMapData(campaignId);
        if (mapData) {
          socket.emit('map-data', { mapData });
        }
        
        console.log(`User ${userId} joined campaign ${campaignId}`);
      } catch (error) {
        console.error('Error joining campaign:', error);
        socket.emit('error', { message: 'Failed to join campaign' });
      }
    });
    
    // Отправка сообщения в чат
    socket.on('send-message', async (data) => {
      try {
        const { campaignId, message, type = 'chat' } = data;
        
        console.log(`User ${userId} sending message to campaign ${campaignId}: ${message.substring(0, 50)}`);
        
        // Проверяем доступ
        const hasAccess = await checkCampaignAccess(campaignId, userId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }
        
        // Сохраняем сообщение в БД
        const savedMessage = await saveMessage(campaignId, userId, message, type);
        
        // Отправляем всем в комнате
        io.to(`campaign:${campaignId}`).emit('new-message', savedMessage);
        
        console.log(`Message sent to campaign ${campaignId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Бросок кубиков
    socket.on('roll-dice', async (data) => {
      try {
        const { campaignId, formula, reason } = data;
        console.log(`User ${userId} rolling dice: ${formula}`);
        
        // Проверяем доступ
        const hasAccess = await checkCampaignAccess(campaignId, userId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }
        
        // Бросаем кубики
        const result = diceRoller.roll(formula);
        console.log('Dice result:', result);
        
        // Создаем сообщение
        const username = socket.user?.username || 'User';
        const message = `${username} rolled ${formula}: ${result.total} ${reason ? `(${reason})` : ''}`;
        
        // Сохраняем в БД
        const savedMessage = await saveMessage(
          campaignId, 
          userId, 
          message, 
          'roll',
          { formula, result, reason }
        );
        
        // Отправляем всем событие броска
        io.to(`campaign:${campaignId}`).emit('dice-rolled', {
          userId,
          username: username,
          formula,
          result,
          reason,
          message: savedMessage
        });
        
        // Также отправляем как обычное сообщение
        io.to(`campaign:${campaignId}`).emit('new-message', savedMessage);
        
        console.log(`Dice roll sent to campaign ${campaignId}`);
      } catch (error) {
        console.error('Error rolling dice:', error);
        socket.emit('error', { message: 'Failed to roll dice' });
      }
    });
    
    // Обновление карты
    socket.on('update-map', async (data) => {
      try {
        const { campaignId, mapData } = data;
        
        console.log(`User ${userId} updating map for campaign ${campaignId}`);
        
        // Проверяем, что пользователь - DM
        const isDM = await checkIsDM(campaignId, userId);
        if (!isDM) {
          socket.emit('error', { message: 'Only DM can update map' });
          return;
        }
        
        // Сохраняем карту в БД
        await saveMapData(campaignId, mapData);
        
        // Отправляем обновление всем
        io.to(`campaign:${campaignId}`).emit('map-updated', { mapData });
        
        console.log(`Map updated for campaign ${campaignId}`);
      } catch (error) {
        console.error('Error updating map:', error);
        socket.emit('error', { message: 'Failed to update map' });
      }
    });
    
    // Отключение
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected from campaign socket`);
      
      // Удаляем из всех комнат
      for (const [campaignId, sockets] of campaignRooms.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          
          // Уведомляем о выходе
          socket.to(`campaign:${campaignId}`).emit('player-left', {
            userId,
            timestamp: new Date()
          });
          
          // Очищаем пустые комнаты
          if (sockets.size === 0) {
            campaignRooms.delete(campaignId);
          }
        }
      }
    });
  });
  
  // Вспомогательные функции
  async function checkCampaignAccess(campaignId, userId) {
    const result = await pool.query(`
      SELECT 1 FROM campaigns c
      LEFT JOIN campaign_players cp ON c.id = cp.campaign_id
      WHERE c.id = $1 AND (c.dm_id = $2 OR cp.user_id = $2)
    `, [campaignId, userId]);
    return result.rows.length > 0;
  }
  
  async function checkIsDM(campaignId, userId) {
    const result = await pool.query(`
      SELECT 1 FROM campaigns WHERE id = $1 AND dm_id = $2
    `, [campaignId, userId]);
    return result.rows.length > 0;
  }
  
  async function getRecentMessages(campaignId, limit = 50) {
    try {
      const result = await pool.query(`
        SELECT m.*, u.username, u.avatar_url
        FROM campaign_messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.campaign_id = $1
        ORDER BY m.created_at ASC
        LIMIT $2
      `, [campaignId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }
  
  async function saveMessage(campaignId, userId, message, type, metadata = null) {
    const result = await pool.query(`
      INSERT INTO campaign_messages (campaign_id, user_id, message, type, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [campaignId, userId, message, type, metadata]);
    
    if (userId) {
      const userResult = await pool.query(`
        SELECT username, avatar_url FROM users WHERE id = $1
      `, [userId]);
      result.rows[0].username = userResult.rows[0]?.username;
      result.rows[0].avatar_url = userResult.rows[0]?.avatar_url;
    }
    
    return result.rows[0];
  }
  
  async function saveMapData(campaignId, mapData) {
    await pool.query(`
      UPDATE campaigns 
      SET map_data = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [campaignId, JSON.stringify(mapData)]);
  }
  
  async function getMapData(campaignId) {
    try {
      const result = await pool.query(
        'SELECT map_data FROM campaigns WHERE id = $1',
        [campaignId]
      );
      return result.rows[0]?.map_data || null;
    } catch (error) {
      console.error('Error getting map data:', error);
      return null;
    }
  }
};