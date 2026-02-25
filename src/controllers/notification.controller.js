import prisma from '../config/prisma.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, isRead } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const notifications = await prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notificações'
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Notificação marcada como lida',
      notification: updated
    });
  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar notificação'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Todas as notificações marcadas como lidas'
    });
  } catch (error) {
    console.error('Erro ao marcar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar notificações'
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Notificação deletada'
    });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar notificação'
    });
  }
};

// @desc    Create notification (System)
// @route   POST /api/notifications
// @access  Private/Admin
export const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, link } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando'
      });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Notificação criada',
      notification
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar notificação'
    });
  }
};

// @desc    Send notification to multiple users
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
export const broadcastNotification = async (req, res) => {
  try {
    const { userIds, type, title, message, link } = req.body;

    if (!userIds || !Array.isArray(userIds) || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando'
      });
    }

    const notifications = await Promise.all(
      userIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            link: link || null
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `${notifications.length} notificações enviadas`,
      count: notifications.length
    });
  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar notificações'
    });
  }
};

// Helper function to create notification (can be used in other controllers)
export const createNotificationHelper = async (userId, type, title, message, link = null) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link
      }
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
};
