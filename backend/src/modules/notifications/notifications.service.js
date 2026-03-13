const pool = require('../../config/db');
const socketConfig = require('../../config/socket');

class NotificationsService {
  /**
   * Crear y distribuir una notificación a los usuarios correspondientes
   */
  async createNotification({ type, title, message, related_id = null, branch_id = null }) {
    try {
      let targetUsersQuery = '';
      let queryParams = [];

      // Lógica de distribución según el tipo de notificación
      if (type === 'LOW_STOCK' || type === 'HIGH_SALE' || type === 'OVERDUE_ACCOUNT') {
        // Admin global o (Encargado/Cajero de la sucursal específica)
        // NOTA: Según la matriz, Cajero solo ve LOW_STOCK.
        if (type === 'LOW_STOCK') {
          targetUsersQuery = `
            SELECT id FROM users 
            WHERE role = 'admin' 
               OR (branch_id = $1 AND role IN ('encargado', 'cajero'))
          `;
        } else {
          targetUsersQuery = `
            SELECT id FROM users 
            WHERE role = 'admin' 
               OR (branch_id = $1 AND role = 'encargado')
          `;
        }
        queryParams = [branch_id];
      } else if (type === 'SECURITY_ALERT') {
        // Solo administradores globales
        targetUsersQuery = `SELECT id FROM users WHERE role = 'admin'`;
        queryParams = [];
      } else {
        // Fallback: solo admins
        targetUsersQuery = `SELECT id FROM users WHERE role = 'admin'`;
      }

      const { rows: targetUsers } = await pool.query(targetUsersQuery, queryParams);

      if (targetUsers.length === 0) return;

      // Crear la notificación para cada usuario destinatario
      const insertQuery = `
        INSERT INTO notifications (user_id, type, title, message, related_id, branch_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const notifications = [];
      for (const user of targetUsers) {
        const { rows } = await pool.query(insertQuery, [
          user.id, type, title, message, related_id, branch_id
        ]);
        const newNotification = rows[0];
        notifications.push(newNotification);

        // Emitir evento WebSocket a la sala del usuario
        try {
          const io = socketConfig.getIO();
          io.to(`room_user_${user.id}`).emit('new_notification', newNotification);
        } catch (err) {
          console.error('Error al emitir notificación por WS:', err.message);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  /**
   * Obtener notificaciones paginadas por usuario
   */
  async getNotifications(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const unreadResult = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return {
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count, 10),
    };
  }

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(notificationId, userId) {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    
    if (result.rowCount === 0) {
      throw new Error('Notificación no encontrada o no autorizada');
    }
    
    return result.rows[0];
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId) {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND is_read = false
       RETURNING *`,
      [userId]
    );
    
    return result.rows;
  }
}

module.exports = new NotificationsService();
