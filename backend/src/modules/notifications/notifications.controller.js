const notificationsService = require('./notifications.service');

const getNotifications = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const data = await notificationsService.getNotifications(req.user.user_id, limit, offset);
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await notificationsService.markAsRead(id, req.user.user_id);
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationsService.markAllAsRead(req.user.user_id);
    
    res.status(200).json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
