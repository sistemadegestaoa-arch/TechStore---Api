import prisma from '../config/prisma.js';

/**
 * Helper para criar notificações automaticamente
 */

// Criar notificação para um usuário
export const createNotification = async (userId, type, title, message, link = null) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link
      }
    });
    console.log(`✅ Notificação criada para usuário ${userId}: ${title}`);
  } catch (error) {
    console.error('❌ Erro ao criar notificação:', error);
  }
};

// Notificação de novo pedido (para cliente)
export const notifyNewOrder = async (order) => {
  await createNotification(
    order.customerId,
    'ORDER',
    '🎉 Pedido Confirmado!',
    `Seu pedido #${order.orderNumber} foi confirmado com sucesso. Total: ${order.total} AOA`,
    `/meus-pedidos`
  );
};

// Notificação de novo pedido (para vendedor) - com nome do cliente
export const notifyVendorNewOrder = async (vendorId, orderNumber, productName, quantity, customerName) => {
  await createNotification(
    vendorId,
    'ORDER',
    '🛍️ Nova Venda!',
    `${customerName} comprou ${quantity}x ${productName} no pedido #${orderNumber}`,
    `/gerenciar-pedidos-vendedor`
  );
};

// Notificação de mudança de status do pedido
export const notifyOrderStatusChange = async (order, oldStatus, newStatus) => {
  const statusMessages = {
    PROCESSING: '⏳ Seu pedido está sendo processado',
    SHIPPING: '🚚 Seu pedido foi enviado!',
    DELIVERED: '✅ Seu pedido foi entregue!',
    CANCELLED: '❌ Seu pedido foi cancelado',
    REFUNDED: '💰 Seu pedido foi reembolsado'
  };

  const message = statusMessages[newStatus] || `Status atualizado para ${newStatus}`;

  await createNotification(
    order.customerId,
    'ORDER',
    message,
    `Pedido #${order.orderNumber} - ${message}`,
    `/meus-pedidos`
  );
};

// Notificação de produto com estoque baixo (para vendedor)
export const notifyLowStock = async (product) => {
  if (product.stock <= product.lowStockThreshold) {
    await createNotification(
      product.vendorId,
      'PRODUCT',
      '⚠️ Estoque Baixo!',
      `O produto "${product.name}" está com estoque baixo (${product.stock} unidades)`,
      `/gestao-estoque`
    );
  }
};

// Notificação de nova avaliação (para vendedor)
export const notifyNewReview = async (review, product) => {
  const stars = '⭐'.repeat(review.rating);
  await createNotification(
    product.vendorId,
    'PRODUCT',
    '⭐ Nova Avaliação!',
    `Seu produto "${product.name}" recebeu uma avaliação: ${stars}`,
    `/product/${product.id}`
  );
};

// Notificação de verificação aprovada (para vendedor)
export const notifyVerificationApproved = async (vendorId) => {
  await createNotification(
    vendorId,
    'SYSTEM',
    '✅ Verificação Aprovada!',
    'Parabéns! Sua conta foi verificada com sucesso. Agora você tem o selo de vendedor verificado!',
    `/perfil-vendedor`
  );
};

// Notificação de verificação rejeitada (para vendedor)
export const notifyVerificationRejected = async (vendorId, reason) => {
  await createNotification(
    vendorId,
    'SYSTEM',
    '❌ Verificação Não Aprovada',
    `Sua solicitação de verificação não foi aprovada. Motivo: ${reason}`,
    `/vendor-verification`
  );
};

// Notificação de promoção/cupom (para todos ou específicos)
export const notifyPromotion = async (userIds, title, message, link = null) => {
  for (const userId of userIds) {
    await createNotification(
      userId,
      'PROMOTION',
      title,
      message,
      link
    );
  }
};

// Notificação de nova mensagem no chat
export const notifyNewMessage = async (receiverId, senderName, message) => {
  await createNotification(
    receiverId,
    'SYSTEM',
    '💬 Nova Mensagem',
    `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
    `/chat`
  );
};

// Notificação de produto favoritado em promoção
export const notifyFavoriteOnSale = async (userId, productName, oldPrice, newPrice) => {
  const discount = ((oldPrice - newPrice) / oldPrice * 100).toFixed(0);
  await createNotification(
    userId,
    'PROMOTION',
    '🔥 Produto Favorito em Promoção!',
    `${productName} está com ${discount}% de desconto! De ${oldPrice} por ${newPrice} AOA`,
    `/favoritos`
  );
};

// Notificação de produto de volta ao estoque
export const notifyBackInStock = async (userId, productName, productId) => {
  await createNotification(
    userId,
    'PRODUCT',
    '✅ Produto Disponível!',
    `${productName} voltou ao estoque! Aproveite antes que acabe.`,
    `/product/${productId}`
  );
};

// Notificação de boas-vindas (novo usuário)
export const notifyWelcome = async (userId, userName) => {
  await createNotification(
    userId,
    'SYSTEM',
    '👋 Bem-vindo à TechStore!',
    `Olá ${userName}! Obrigado por se cadastrar. Aproveite nossas ofertas!`,
    `/produtos`
  );
};

// Notificação de novo produto para todos os clientes
export const notifyAllCustomersNewProduct = async (product) => {
  try {
    // Buscar todos os clientes ativos
    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        isActive: true
      },
      select: {
        id: true
      }
    });

    console.log(`📢 Notificando ${customers.length} clientes sobre novo produto: ${product.name}`);

    // Criar notificação para cada cliente
    const notifications = customers.map(customer => ({
      userId: customer.id,
      type: 'PRODUCT',
      title: '🆕 Novo Produto Disponível!',
      message: `${product.name} - ${product.price} AOA. Confira agora!`,
      link: `/product/${product.id}`
    }));

    // Criar todas as notificações de uma vez (bulk insert)
    await prisma.notification.createMany({
      data: notifications
    });

    console.log(`✅ ${customers.length} notificações criadas para novo produto!`);
  } catch (error) {
    console.error('❌ Erro ao notificar clientes sobre novo produto:', error);
  }
};

// Notificação de carrinho abandonado (após 24h)
export const notifyAbandonedCart = async (userId, itemCount) => {
  await createNotification(
    userId,
    'PROMOTION',
    '🛒 Você esqueceu algo!',
    `Você tem ${itemCount} ${itemCount === 1 ? 'item' : 'itens'} no carrinho. Finalize sua compra agora!`,
    `/cart`
  );
};

export default {
  createNotification,
  notifyNewOrder,
  notifyVendorNewOrder,
  notifyOrderStatusChange,
  notifyLowStock,
  notifyNewReview,
  notifyVerificationApproved,
  notifyVerificationRejected,
  notifyPromotion,
  notifyNewMessage,
  notifyFavoriteOnSale,
  notifyBackInStock,
  notifyWelcome,
  notifyAbandonedCart,
  notifyAllCustomersNewProduct
};
