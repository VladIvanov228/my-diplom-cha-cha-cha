const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/campaigns - список кампаний пользователя
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const campaigns = await pool.query(`
      SELECT DISTINCT c.*, 
        u.username as dm_name,
        EXISTS(SELECT 1 FROM campaign_players cp WHERE cp.campaign_id = c.id AND cp.user_id = $1) as is_player
      FROM campaigns c
      LEFT JOIN users u ON c.dm_id = u.id
      LEFT JOIN campaign_players cp ON c.id = cp.campaign_id
      WHERE c.dm_id = $1 OR cp.user_id = $1
      ORDER BY c.updated_at DESC
    `, [userId]);
    
    res.json(campaigns.rows);
  } catch (error) {
    console.error('Error in GET /campaigns:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/campaigns - создать кампанию
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { name, description, dm_pin, mapCount, mapNames } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Campaign name is required' });
    }
    
    if (dm_pin && !/^\d{4,6}$/.test(dm_pin)) {
      return res.status(400).json({ error: 'PIN must be 4-6 digits' });
    }
    
    const result = await pool.query(`
      INSERT INTO campaigns (name, description, dm_id, dm_pin)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name.trim(), description?.trim() || null, userId, dm_pin || null]);
    
    const campaignId = result.rows[0].id;
    
    await pool.query(`
      INSERT INTO campaign_players (campaign_id, user_id, role, entry_role)
      VALUES ($1, $2, 'dm', 'dm')
      ON CONFLICT (campaign_id, user_id) DO NOTHING
    `, [campaignId, userId]);
    
    const numMaps = Math.min(Math.max(mapCount || 1, 1), 10);
    const maps = [];
    
    for (let i = 0; i < numMaps; i++) {
      const mapName = mapNames?.[i] || `Карта ${i + 1}`;
      const mapResult = await pool.query(`
        INSERT INTO maps (name, campaign_id, width, height, grid_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [mapName, campaignId, 20, 20, 'square']);
      maps.push(mapResult.rows[0]);
    }
    
    const campaignWithDM = await pool.query(`
      SELECT c.*, u.username as dm_name
      FROM campaigns c
      LEFT JOIN users u ON c.dm_id = u.id
      WHERE c.id = $1
    `, [campaignId]);
    
    res.status(201).json({
      ...campaignWithDM.rows[0],
      maps
    });
  } catch (error) {
    console.error('Error in POST /campaigns:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// GET /api/campaigns/:id - детали кампании
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    
    console.log(`📋 [GET /campaigns/${id}] Request from user ${userId}`);
    
    const accessCheck = await pool.query(`
      SELECT role FROM campaign_players 
      WHERE campaign_id = $1 AND user_id = $2
      UNION
      SELECT 'dm' as role FROM campaigns 
      WHERE id = $1 AND dm_id = $2
    `, [id, userId]);
    
    if (accessCheck.rows.length === 0) {
      console.log(`❌ Access denied for user ${userId} to campaign ${id}`);
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const campaign = await pool.query(`
      SELECT c.*, u.username as dm_name
      FROM campaigns c
      LEFT JOIN users u ON c.dm_id = u.id
      WHERE c.id = $1
    `, [id]);
    
    if (campaign.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const players = await pool.query(`
      SELECT 
        cp.id, cp.campaign_id, cp.user_id, cp.role, cp.entry_role,
        cp.joined_at, cp.character_id,
        u.username, u.avatar_url,
        ch.name as character_name
      FROM campaign_players cp
      LEFT JOIN users u ON cp.user_id = u.id
      LEFT JOIN characters ch ON cp.character_id = ch.id
      WHERE cp.campaign_id = $1
      ORDER BY 
        CASE cp.role WHEN 'dm' THEN 1 WHEN 'player' THEN 2 ELSE 3 END,
        cp.joined_at
    `, [id]);
    
    const maps = await pool.query(`
      SELECT id, name, width, height, grid_type, updated_at
      FROM maps
      WHERE campaign_id = $1
      ORDER BY updated_at DESC
    `, [id]);
    
    const activeBattle = await pool.query(`
      SELECT * FROM battles
      WHERE campaign_id = $1 AND state = 'active'
      LIMIT 1
    `, [id]);
    
    const campaignData = {
      ...campaign.rows[0],
      players: players.rows,
      maps: maps.rows,
      activeBattle: activeBattle.rows[0] || null,
      userRole: accessCheck.rows[0].role
    };
    
    console.log(`✅ Campaign ${id} fetched successfully`);
    res.json(campaignData);
  } catch (error) {
    console.error('❌ Error in GET /campaigns/:id:', error);
    res.status(500).json({ error: 'Server error', details: error.message, hint: error.hint });
  }
});

// PUT /api/campaigns/:id - обновить
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const { name, description, is_active } = req.body;
    
    const dmCheck = await pool.query('SELECT id FROM campaigns WHERE id = $1 AND dm_id = $2', [id, userId]);
    if (dmCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only DM can edit campaign' });
    }
    
    const updates = [];
    const values = [id];
    let paramIndex = 2;
    
    if (name !== undefined) {
      if (name.trim().length === 0) return res.status(400).json({ error: 'Campaign name cannot be empty' });
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description?.trim() || null);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const result = await pool.query(`UPDATE campaigns SET ${updates.join(', ')} WHERE id = $1 RETURNING *`, values);
    const campaignWithDM = await pool.query('SELECT c.*, u.username as dm_name FROM campaigns c LEFT JOIN users u ON c.dm_id = u.id WHERE c.id = $1', [result.rows[0].id]);
    
    res.json(campaignWithDM.rows[0]);
  } catch (error) {
    console.error('Error in PUT /campaigns/:id:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// DELETE /api/campaigns/:id - удалить
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    
    const dmCheck = await client.query('SELECT id FROM campaigns WHERE id = $1 AND dm_id = $2', [id, userId]);
    if (dmCheck.rows.length === 0) return res.status(403).json({ error: 'Only DM can delete campaign' });
    
    await client.query('BEGIN');
    await client.query('DELETE FROM campaign_messages WHERE campaign_id = $1', [id]);
    await client.query('DELETE FROM campaign_invites WHERE campaign_id = $1', [id]);
    await client.query('DELETE FROM battles WHERE campaign_id = $1', [id]);
    await client.query('DELETE FROM maps WHERE campaign_id = $1', [id]);
    await client.query('DELETE FROM campaign_players WHERE campaign_id = $1', [id]);
    await client.query('DELETE FROM campaigns WHERE id = $1', [id]);
    await client.query('COMMIT');
    
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in DELETE /campaigns/:id:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  } finally {
    client.release();
  }
});

// POST /api/campaigns/:id/invite-code
router.post('/:id/invite-code', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    const rights = await pool.query('SELECT dm_id FROM campaigns WHERE id = $1', [id]);
    if (rights.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    if (rights.rows[0]?.dm_id !== userId) return res.status(403).json({ error: 'Only DM can generate code' });

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query('DELETE FROM campaign_invites WHERE campaign_id = $1', [id]);
    
    const result = await pool.query(`
      INSERT INTO campaign_invites (campaign_id, invite_code, expires_at, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING invite_code as code, expires_at
    `, [id, code, expiresAt, userId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Invite code error:', error);
    res.status(500).json({ error: 'Failed to generate invite code' });
  }
});

// POST /api/campaigns/:id/join
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const { character_id, entry_role, dm_pin } = req.body;

    const campaign = await pool.query('SELECT * FROM campaigns WHERE id = $1', [id]);
    if (campaign.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });

    const existing = await pool.query('SELECT * FROM campaign_players WHERE campaign_id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE campaign_players SET entry_role = $1, character_id = COALESCE($2, character_id) WHERE campaign_id = $3 AND user_id = $4',
        [entry_role || 'player', character_id || null, id, userId]
      );
      return res.json({ message: 'Entry role updated', alreadyMember: true });
    }

    if (entry_role === 'dm') {
      if (campaign.rows[0].dm_id !== userId) return res.status(403).json({ error: 'Only campaign creator can join as DM' });
      if (campaign.rows[0].dm_pin && campaign.rows[0].dm_pin !== dm_pin) return res.status(403).json({ error: 'Invalid DM PIN' });
    } else if (entry_role === 'player') {
      if (!character_id) return res.status(400).json({ error: 'Character selection required for players' });
      const charCheck = await pool.query('SELECT id FROM characters WHERE id = $1 AND user_id = $2', [character_id, userId]);
      if (charCheck.rows.length === 0) return res.status(400).json({ error: 'Character not found or does not belong to you' });
    }

    await pool.query(`
      INSERT INTO campaign_players (campaign_id, user_id, role, entry_role, character_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, userId, entry_role === 'dm' ? 'dm' : (entry_role || 'player'), entry_role || 'player', character_id || null]);

    res.json({ message: 'Joined campaign successfully' });
  } catch (error) {
    console.error('Error in POST /campaigns/:id/join:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/campaigns/:id/invite
router.post('/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const { username, role = 'player' } = req.body;
    
    const dmCheck = await pool.query('SELECT id FROM campaigns WHERE id = $1 AND dm_id = $2', [id, userId]);
    if (dmCheck.rows.length === 0) return res.status(403).json({ error: 'Only DM can invite players' });
    
    const invitedUser = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $1', [username]);
    if (invitedUser.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const invitedUserId = invitedUser.rows[0].id;
    const existingPlayer = await pool.query('SELECT id FROM campaign_players WHERE campaign_id = $1 AND user_id = $2', [id, invitedUserId]);
    if (existingPlayer.rows.length > 0) return res.status(400).json({ error: 'User already in campaign' });
    
    await pool.query('INSERT INTO campaign_players (campaign_id, user_id, role) VALUES ($1, $2, $3)', [id, invitedUserId, role]);
    
    const playerData = await pool.query(
      'SELECT cp.*, u.username, u.avatar_url FROM campaign_players cp LEFT JOIN users u ON cp.user_id = u.id WHERE cp.campaign_id = $1 AND cp.user_id = $2',
      [id, invitedUserId]
    );
    
    res.json({ message: 'Player invited successfully', player: playerData.rows[0] });
  } catch (error) {
    console.error('Error in POST /campaigns/:id/invite:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/campaigns/:id/leave
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    
    const isDM = await pool.query('SELECT 1 FROM campaigns WHERE id = $1 AND dm_id = $2', [id, userId]);
    if (isDM.rows.length > 0) return res.status(400).json({ error: 'DM cannot leave the campaign. Delete it instead.' });
    
    await pool.query('DELETE FROM campaign_players WHERE campaign_id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Left campaign successfully' });
  } catch (error) {
    console.error('Error in POST /campaigns/:id/leave:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// DELETE /api/campaigns/:id/players/:playerId
router.delete('/:id/players/:playerId', async (req, res) => {
  try {
    const { id, playerId } = req.params;
    const userId = req.user.userId || req.user.id;
    
    const canRemove = await pool.query('SELECT 1 FROM campaigns WHERE id = $1 AND (dm_id = $2 OR $2 = $3)', [id, userId, playerId]);
    if (canRemove.rows.length === 0) return res.status(403).json({ error: 'Cannot remove this player' });
    
    const isDM = await pool.query('SELECT 1 FROM campaigns WHERE id = $1 AND dm_id = $2', [id, playerId]);
    if (isDM.rows.length > 0) return res.status(400).json({ error: 'Cannot remove DM from campaign' });
    
    await pool.query('DELETE FROM campaign_players WHERE campaign_id = $1 AND user_id = $2', [id, playerId]);
    res.json({ message: 'Player removed successfully' });
  } catch (error) {
    console.error('Error in DELETE /campaigns/:id/players/:playerId:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/campaigns/:id/players/:playerId/character
router.post('/:id/players/:playerId/character', async (req, res) => {
  try {
    const { id, playerId } = req.params;
    const userId = req.user.userId || req.user.id;
    const { characterId } = req.body;
    
    const canUpdate = await pool.query(`
      SELECT 1 FROM campaign_players 
      WHERE campaign_id = $1 AND user_id = $2 AND (user_id = $3 OR EXISTS(SELECT 1 FROM campaigns WHERE id = $1 AND dm_id = $3))
    `, [id, playerId, userId]);
    if (canUpdate.rows.length === 0) return res.status(403).json({ error: 'Cannot update this player' });
    
    const characterCheck = await pool.query('SELECT id FROM characters WHERE id = $1 AND user_id = $2', [characterId, playerId]);
    if (characterCheck.rows.length === 0) return res.status(400).json({ error: 'Character not found or does not belong to player' });
    
    await pool.query('UPDATE campaign_players SET character_id = $1 WHERE campaign_id = $2 AND user_id = $3', [characterId, id, playerId]);
    res.json({ message: 'Character selected successfully' });
  } catch (error) {
    console.error('Error in POST /campaigns/:id/players/:playerId/character:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;