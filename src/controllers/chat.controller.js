import prisma from '../config/prisma.js';
import { notifyNewMessage } from '../utils/notificationHelper.js';

// Note: This is a simple chat system. For production, consider using Socket.io for real-time
// or integrate with WhatsApp Business API

// @desc    Send message
// @route   POST /api/chat/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message, productId } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Destinatário e mensagem são obrigatórios'
      });
    }

    // Create conversation if doesn't exist
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId }
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: senderId,
          user2Id: receiverId,
          productId: productId || null
        }
      });
    }

    // Create message
    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId,
        message,
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessage: message
      }
    });

    // Notificar destinatário sobre nova mensagem
    try {
      await notifyNewMessage(receiverId, req.user.name, message);
    } catch (notifError) {
      console.error('❌ Erro ao enviar notificação:', notifError);
    }

    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem'
    });
  }
};

// @desc    Get user conversations
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            storeName: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            storeName: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            message: true,
            createdAt: true,
            isRead: true,
            senderId: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    // Format conversations
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0];
      const unreadCount = conv.messages.filter(m => 
        m.receiverId === userId && !m.isRead
      ).length;

      return {
        id: conv.id,
        otherUser,
        product: conv.product,
        lastMessage: lastMessage?.message,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        isLastMessageFromMe: lastMessage?.senderId === userId
      };
    });

    res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar conversas'
    });
  }
};

// @desc    Get conversation messages
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
export const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      skip,
      take,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    const total = await prisma.message.count({
      where: { conversationId: id }
    });

    res.json({
      success: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar mensagens'
    });
  }
};

// @desc    Mark messages as read
// @route   PATCH /api/chat/conversations/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar mensagens'
    });
  }
};

// @desc    Get unread count
// @route   GET /api/chat/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar mensagens não lidas'
    });
  }
};

// @desc    Delete conversation
// @route   DELETE /api/chat/conversations/:id
// @access  Private
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    // Delete messages first
    await prisma.message.deleteMany({
      where: { conversationId: id }
    });

    // Delete conversation
    await prisma.conversation.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Conversa deletada'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar conversa'
    });
  }
};

// @desc    Get WhatsApp link for product
// @route   GET /api/chat/whatsapp/:productId
// @access  Public
export const getWhatsAppLink = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          select: {
            phone: true,
            storeName: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    if (!product.vendor.phone) {
      return res.status(400).json({
        success: false,
        message: 'Vendedor não tem WhatsApp cadastrado'
      });
    }

    // Format phone number (remove non-digits)
    const phone = product.vendor.phone.replace(/\D/g, '');

    // Create WhatsApp message
    const message = `Olá! Tenho interesse no produto: ${product.name}\nPreço: ${product.price} AOA\nLink: ${process.env.FRONTEND_URL}/product/${product.id}`;

    // WhatsApp link format: https://wa.me/PHONE?text=MESSAGE
    const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      whatsappLink,
      vendor: {
        name: product.vendor.storeName,
        phone: product.vendor.phone
      }
    });
  } catch (error) {
    console.error('Get WhatsApp link error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar link do WhatsApp'
    });
  }
};
