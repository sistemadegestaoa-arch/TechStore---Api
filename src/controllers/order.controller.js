import prisma from '../config/prisma.js';

// @desc    Create order
// @route   POST /api/orders
// @access  Private/Customer
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      shippingCity,
      shippingProvince,
      shippingPostalCode,
      shippingPhone,
      paymentMethod,
      customerNotes
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Carrinho vazio' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { vendor: true }
      });

      if (!product) {
        return res.status(404).json({ message: `Produto ${item.productId} não encontrado` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Estoque insuficiente para ${product.name}`
        });
      }

      const itemSubtotal = product.price * item.quantity;
      const commission = itemSubtotal * (product.vendor.commissionRate / 100);
      const vendorEarnings = itemSubtotal - commission;

      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        vendorId: product.vendorId,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal,
        commission,
        vendorEarnings,
        productName: product.name,
        productImage: product.images[0] || null,
        productSku: product.sku
      });
    }

    const shippingCost = 0; // TODO: Calculate shipping
    const tax = 0; // TODO: Calculate tax
    const discount = 0;
    const total = subtotal + shippingCost + tax - discount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: req.user.id,
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        shippingAddress,
        shippingCity,
        shippingProvince,
        shippingPostalCode,
        shippingPhone,
        paymentMethod,
        customerNotes,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true,
            vendor: {
              select: {
                id: true,
                name: true,
                storeName: true
              }
            }
          }
        }
      }
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          totalSales: { increment: item.quantity }
        }
      });
    }

    res.status(201).json({
      message: 'Pedido criado com sucesso',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Erro ao criar pedido' });
  }
};

// @desc    Get customer orders
// @route   GET /api/orders
// @access  Private/Customer
export const getCustomerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      customerId: req.user.id
    };

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true
              }
            }
          }
        }
      }
    });

    const total = await prisma.order.count({ where });

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ message: 'Erro ao buscar pedidos' });
  }
};

// @desc    Get vendor orders
// @route   GET /api/orders/vendor/all
// @access  Private/Vendor
export const getVendorOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause for order items
    const itemWhere = {
      vendorId: req.user.id
    };

    // Get order items for this vendor
    const orderItems = await prisma.orderItem.findMany({
      where: itemWhere,
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by order
    const ordersMap = new Map();
    
    for (const item of orderItems) {
      const orderId = item.order.id;
      
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          ...item.order,
          items: []
        });
      }
      
      ordersMap.get(orderId).items.push({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        commission: item.commission,
        vendorEarnings: item.vendorEarnings,
        product: item.product
      });
    }

    let orders = Array.from(ordersMap.values());

    // Filter by status if provided
    if (status) {
      orders = orders.filter(order => order.status === status);
    }

    // Pagination
    const total = orders.length;
    orders = orders.slice(skip, skip + take);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({ message: 'Erro ao buscar pedidos' });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: true,
            vendor: {
              select: {
                id: true,
                name: true,
                storeName: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // Check authorization
    const isCustomer = order.customerId === req.user.id;
    const isVendor = order.items.some(item => item.vendorId === req.user.id);

    if (!isCustomer && !isVendor && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Erro ao buscar pedido' });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Vendor
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    // Check if vendor has items in this order
    const hasVendorItems = order.items.some(item => item.vendorId === req.user.id);
    
    if (!hasVendorItems && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    // Update order
    const updateData = { status };

    if (status === 'SHIPPING' && trackingNumber) {
      updateData.trackingNumber = trackingNumber;
      updateData.shippedAt = new Date();
    }

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = 'PAID';
      updateData.paidAt = new Date();
    }

    if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json({
      message: 'Status do pedido atualizado',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
};

// @desc    Get vendor statistics
// @route   GET /api/orders/vendor/stats
// @access  Private/Vendor
export const getVendorStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get all order items for vendor
    const orderItems = await prisma.orderItem.findMany({
      where: {
        vendorId: req.user.id,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter
        })
      },
      include: {
        order: true
      }
    });

    // Calculate statistics
    const totalOrders = new Set(orderItems.map(item => item.orderId)).size;
    const totalRevenue = orderItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const totalCommission = orderItems.reduce((sum, item) => sum + Number(item.commission), 0);
    const totalEarnings = orderItems.reduce((sum, item) => sum + Number(item.vendorEarnings), 0);

    // Orders by status
    const ordersByStatus = {};
    orderItems.forEach(item => {
      const status = item.order.status;
      if (!ordersByStatus[status]) {
        ordersByStatus[status] = 0;
      }
      ordersByStatus[status]++;
    });

    // Get product count
    const productCount = await prisma.product.count({
      where: { vendorId: req.user.id }
    });

    const activeProductCount = await prisma.product.count({
      where: {
        vendorId: req.user.id,
        status: 'ACTIVE'
      }
    });

    res.json({
      totalOrders,
      totalRevenue,
      totalCommission,
      totalEarnings,
      ordersByStatus,
      productCount,
      activeProductCount,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    });
  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
};
