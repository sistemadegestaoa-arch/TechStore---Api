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

    console.log('📨 Enviando mensagem:', { senderId, receiverId, message: message?.substring(0, 50), productId });

    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Destinatário e mensagem são obrigatórios'
      });
    }

    // Validação: não pode enviar mensagem para si mesmo
    if (senderId === receiverId) {
      console.error('❌ Tentativa de enviar mensagem para si mesmo:', req.user.name);
      return res.status(400).json({
        success: false,
        message: 'Você não pode enviar mensagem para si mesmo'
      });
    }

    // Validate receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      console.error('❌ Destinatário não encontrado:', receiverId);
      return res.status(404).json({
        success: false,
        message: 'Destinatário não encontrado'
      });
    }

    console.log('✅ Destinatário encontrado:', receiver.name);

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

    console.log('📋 Carregando conversas para:', req.user.name, '(', userId, ')');

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
            storeName: true,
            role: true,
            phone: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            storeName: true,
            role: true,
            phone: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    // Format conversations
    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      
      console.log('💬 Conversa:', {
        id: conv.id,
        user1: conv.user1.name,
        user2: conv.user2.name,
        currentUser: req.user.name,
        otherUser: otherUser.name
      });
      
      // Get unread count for this conversation
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          receiverId: userId,
          isRead: false
        }
      });

      return {
        id: conv.id,
        otherUser,
        product: conv.product,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        isLastMessageFromMe: conv.lastMessage ? false : false // Será atualizado quando tiver mensagens
      };
    }));

    console.log('✅ Retornando', formattedConversations.length, 'conversas para', req.user.name);

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

    console.log('🔍 Buscando mensagens:', { conversationId: id, userId, userName: req.user.name });

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
      console.error('❌ ACESSO NEGADO: Usuário', req.user.name, 'tentou acessar conversa', id);
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    console.log('✅ Acesso autorizado à conversa:', id);

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

// @desc    Get all users available for chat
// @route   GET /api/chat/users
// @access  Private
export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { search, role } = req.query;

    console.log('👥 Buscando usuários para:', req.user.name, '- Excluindo ID:', currentUserId);

    // Build where clause
    const where = {
      id: { not: currentUserId }, // Exclude current user
      isActive: true
    };

    // Filter by role if provided
    if (role && ['CUSTOMER', 'VENDOR', 'ADMIN'].includes(role)) {
      where.role = role;
    }

    // Filter by search term
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { storeName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        storeName: true,
        phone: true,
        isActive: true
      },
      orderBy: [
        { role: 'asc' }, // ADMIN, CUSTOMER, VENDOR
        { name: 'asc' }
      ],
      take: 100 // Limit to 100 users
    });

    // Get existing conversations to mark users with active chats
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: currentUserId },
          { user2Id: currentUserId }
        ]
      },
      select: {
        user1Id: true,
        user2Id: true
      }
    });

    // Create set of user IDs with existing conversations
    const conversationUserIds = new Set();
    conversations.forEach(conv => {
      if (conv.user1Id !== currentUserId) conversationUserIds.add(conv.user1Id);
      if (conv.user2Id !== currentUserId) conversationUserIds.add(conv.user2Id);
    });

    // Add hasConversation flag to users
    const usersWithConversationFlag = users.map(user => ({
      ...user,
      hasConversation: conversationUserIds.has(user.id)
    }));

    res.json({
      success: true,
      users: usersWithConversationFlag,
      total: usersWithConversationFlag.length
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuários'
    });
  }
};
