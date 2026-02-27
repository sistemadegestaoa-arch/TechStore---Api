import prisma from '../config/prisma.js';

// ==================== DASHBOARD ====================

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Carregando estatísticas do dashboard...');
    
    // Users statistics
    const totalUsers = await prisma.user.count();
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalVendors = await prisma.user.count({ where: { role: 'VENDOR' } });
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    
    // New users this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: startOfMonth } }
    });

    console.log('✅ Estatísticas de usuários carregadas');

    // Products statistics
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({ where: { status: 'ACTIVE' } });
    const pendingProducts = await prisma.product.count({ where: { status: 'PENDING' } });
    const outOfStockProducts = await prisma.product.count({ where: { stock: 0 } });

    console.log('✅ Estatísticas de produtos carregadas');

    // Orders statistics
    const totalOrders = await prisma.order.count();
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
    const processingOrders = await prisma.order.count({ where: { status: 'PROCESSING' } });
    const deliveredOrders = await prisma.order.count({ where: { status: 'DELIVERED' } });
    const cancelledOrders = await prisma.order.count({ where: { status: 'CANCELLED' } });

    console.log('✅ Estatísticas de pedidos carregadas');

    // Revenue statistics
    const totalRevenue = await prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { total: true }
    });

    const monthlyRevenue = await prisma.order.aggregate({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: startOfMonth }
      },
      _sum: { total: true }
    });

    console.log('✅ Estatísticas de receita carregadas');

    // Categories statistics
    const totalCategories = await prisma.category.count();
    const activeCategories = await prisma.category.count({ where: { isActive: true } });

    console.log('✅ Estatísticas de categorias carregadas');

    // Reviews statistics
    const totalReviews = await prisma.review.count();
    const pendingReviews = await prisma.review.count({ where: { isApproved: false } });

    console.log('✅ Estatísticas de avaliações carregadas');

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    console.log('✅ Pedidos recentes carregados');

    // Top selling products
    const topProducts = await prisma.product.findMany({
      take: 10,
      orderBy: { totalSales: 'desc' },
      include: {
        category: { select: { name: true } },
        vendor: { select: { name: true, storeName: true } }
      }
    });

    console.log('✅ Produtos mais vendidos carregados');
    console.log('✅ Todas as estatísticas carregadas com sucesso!');

    res.json({
      users: {
        total: totalUsers,
        customers: totalCustomers,
        vendors: totalVendors,
        admins: totalAdmins,
        newThisMonth: newUsersThisMonth
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        pending: pendingProducts,
        outOfStock: outOfStockProducts
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        monthly: monthlyRevenue._sum.total || 0
      },
      categories: {
        total: totalCategories,
        active: activeCategories
      },
      reviews: {
        total: totalReviews,
        pending: pendingReviews
      },
      recentOrders,
      topProducts
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas do dashboard:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erro ao buscar estatísticas',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ==================== USER MANAGEMENT ====================

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const users = await prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        storeName: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            status: true
          }
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Remove password
    const { password, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, isActive, isEmailVerified } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(isEmailVerified !== undefined && { isEmailVerified })
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Você não pode deletar sua própria conta' });
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Erro ao deletar usuário' });
  }
};

// ==================== PRODUCT MANAGEMENT ====================

// @desc    Get all products with filters
// @route   GET /api/admin/products
// @access  Private/Admin
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, categoryId, vendorId } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true, storeName: true } }
      }
    });

    const total = await prisma.product.count({ where });

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
};

// @desc    Update product status
// @route   PATCH /api/admin/products/:id/status
// @access  Private/Admin
export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'OUT_OF_STOCK'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { status },
      include: {
        category: { select: { name: true } },
        vendor: { select: { name: true, storeName: true } }
      }
    });

    res.json({
      message: 'Status do produto atualizado',
      product
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({ where: { id } });

    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Erro ao deletar produto' });
  }
};

// ==================== ORDER MANAGEMENT ====================

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        items: {
          include: {
            product: { select: { id: true, name: true } },
            vendor: { select: { id: true, name: true, storeName: true } }
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
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Erro ao buscar pedidos' });
  }
};

// @desc    Update order status (Admin override)
// @route   PATCH /api/admin/orders/:id/status
// @access  Private/Admin
export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const updateData = { status };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = 'PAID';
      updateData.paidAt = new Date();
    }

    if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { name: true, email: true } },
        items: { include: { product: true } }
      }
    });

    res.json({
      message: 'Status do pedido atualizado',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
};

// ==================== CATEGORY MANAGEMENT ====================

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({ where: { slug } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Categoria já existe' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon
      }
    });

    res.status(201).json({
      message: 'Categoria criada com sucesso',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Erro ao criar categoria' });
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    const updateData = {};

    if (name && name !== category.name) {
      updateData.name = name;
      updateData.slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Categoria atualizada com sucesso',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Erro ao atualizar categoria' });
  }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productsCount = await prisma.product.count({ where: { categoryId: id } });

    if (productsCount > 0) {
      return res.status(400).json({
        message: `Não é possível deletar. Existem ${productsCount} produtos nesta categoria.`
      });
    }

    await prisma.category.delete({ where: { id } });

    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Erro ao deletar categoria' });
  }
};

// ==================== REVIEWS MANAGEMENT ====================

// @desc    Get all reviews
// @route   GET /api/admin/reviews
// @access  Private/Admin
export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, isApproved } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (isApproved !== undefined) {
      where.isApproved = isApproved === 'true';
    }

    const reviews = await prisma.review.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, email: true } }
      }
    });

    const total = await prisma.review.count({ where });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ message: 'Erro ao buscar avaliações' });
  }
};

// @desc    Approve/Reject review
// @route   PATCH /api/admin/reviews/:id/approve
// @access  Private/Admin
export const approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await prisma.review.update({
      where: { id },
      data: { isApproved },
      include: {
        product: { select: { name: true } },
        customer: { select: { name: true } }
      }
    });

    res.json({
      message: isApproved ? 'Avaliação aprovada' : 'Avaliação rejeitada',
      review
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({ message: 'Erro ao atualizar avaliação' });
  }
};

// @desc    Delete review
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.review.delete({ where: { id } });

    res.json({ message: 'Avaliação deletada com sucesso' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Erro ao deletar avaliação' });
  }
};

// ==================== NEWSLETTER MANAGEMENT ====================

// @desc    Get all newsletter subscribers
// @route   GET /api/admin/newsletter
// @access  Private/Admin
export const getAllSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }

    const subscribers = await prisma.newsletter.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.newsletter.count({ where });

    res.json({
      subscribers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all subscribers error:', error);
    res.status(500).json({ message: 'Erro ao buscar inscritos' });
  }
};

// @desc    Toggle subscriber status
// @route   PATCH /api/admin/newsletter/:id/toggle
// @access  Private/Admin
export const toggleSubscriberStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await prisma.newsletter.findUnique({ where: { id } });

    if (!subscriber) {
      return res.status(404).json({ message: 'Inscrito não encontrado' });
    }

    const updatedSubscriber = await prisma.newsletter.update({
      where: { id },
      data: { isActive: !subscriber.isActive }
    });

    res.json({
      message: updatedSubscriber.isActive ? 'Inscrição ativada' : 'Inscrição desativada',
      subscriber: updatedSubscriber
    });
  } catch (error) {
    console.error('Toggle subscriber status error:', error);
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
};

// @desc    Delete subscriber
// @route   DELETE /api/admin/newsletter/:id
// @access  Private/Admin
export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.newsletter.delete({ where: { id } });

    res.json({ message: 'Inscrito deletado com sucesso' });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({ message: 'Erro ao deletar inscrito' });
  }
};

// @desc    Get newsletter statistics
// @route   GET /api/admin/newsletter/stats
// @access  Private/Admin
export const getNewsletterStats = async (req, res) => {
  try {
    const totalSubscribers = await prisma.newsletter.count();
    const activeSubscribers = await prisma.newsletter.count({ where: { isActive: true } });
    const inactiveSubscribers = await prisma.newsletter.count({ where: { isActive: false } });

    // New subscribers this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newThisMonth = await prisma.newsletter.count({
      where: { createdAt: { gte: startOfMonth } }
    });

    res.json({
      total: totalSubscribers,
      active: activeSubscribers,
      inactive: inactiveSubscribers,
      newThisMonth
    });
  } catch (error) {
    console.error('Get newsletter stats error:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
};

// ==================== TEAM MANAGEMENT ====================

// @desc    Get all team members (Admin)
// @route   GET /api/admin/team
// @access  Private/Admin
export const getAllTeamMembers = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const members = await prisma.teamMember.findMany({
      where,
      skip,
      take,
      orderBy: { order: 'asc' }
    });

    const total = await prisma.teamMember.count({ where });

    res.json({
      members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all team members error:', error);
    res.status(500).json({ message: 'Erro ao buscar membros da equipe' });
  }
};

// @desc    Create team member (Admin)
// @route   POST /api/admin/team
// @access  Private/Admin
export const createTeamMemberAdmin = async (req, res) => {
  try {
    const { name, role, bio, email, linkedin, twitter, avatar, order } = req.body;

    if (!name || !role) {
      return res.status(400).json({ message: 'Nome e cargo são obrigatórios' });
    }

    const member = await prisma.teamMember.create({
      data: {
        name,
        role,
        bio,
        email,
        linkedin,
        twitter,
        avatar,
        order: order ? parseInt(order) : 0
      }
    });

    res.status(201).json({
      message: 'Membro adicionado com sucesso',
      member
    });
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ message: 'Erro ao criar membro' });
  }
};

// @desc    Update team member (Admin)
// @route   PUT /api/admin/team/:id
// @access  Private/Admin
export const updateTeamMemberAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, bio, email, linkedin, twitter, avatar, order, isActive } = req.body;

    const member = await prisma.teamMember.findUnique({ where: { id } });

    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(bio !== undefined && { bio }),
        ...(email !== undefined && { email }),
        ...(linkedin !== undefined && { linkedin }),
        ...(twitter !== undefined && { twitter }),
        ...(avatar !== undefined && { avatar }),
        ...(order !== undefined && { order: parseInt(order) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      message: 'Membro atualizado com sucesso',
      member: updatedMember
    });
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ message: 'Erro ao atualizar membro' });
  }
};

// @desc    Delete team member (Admin)
// @route   DELETE /api/admin/team/:id
// @access  Private/Admin
export const deleteTeamMemberAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.teamMember.delete({ where: { id } });

    res.json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ message: 'Erro ao remover membro' });
  }
};

// @desc    Toggle team member status
// @route   PATCH /api/admin/team/:id/toggle
// @access  Private/Admin
export const toggleTeamMemberStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await prisma.teamMember.findUnique({ where: { id } });

    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id },
      data: { isActive: !member.isActive }
    });

    res.json({
      message: updatedMember.isActive ? 'Membro ativado' : 'Membro desativado',
      member: updatedMember
    });
  } catch (error) {
    console.error('Toggle team member status error:', error);
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
};

// @desc    Get team statistics
// @route   GET /api/admin/team/stats
// @access  Private/Admin
export const getTeamStats = async (req, res) => {
  try {
    const totalMembers = await prisma.teamMember.count();
    const activeMembers = await prisma.teamMember.count({ where: { isActive: true } });
    const inactiveMembers = await prisma.teamMember.count({ where: { isActive: false } });

    res.json({
      total: totalMembers,
      active: activeMembers,
      inactive: inactiveMembers
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
};

// ==================== REPORTS ====================

// @desc    Get sales report
// @route   GET /api/admin/reports/sales
// @access  Private/Admin
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const where = {
      status: 'DELIVERED'
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        total: true,
        createdAt: true,
        items: {
          select: {
            subtotal: true,
            commission: true,
            vendorEarnings: true
          }
        }
      }
    });

    // Calculate totals
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalCommission = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + Number(item.commission), 0);
    }, 0);
    const totalVendorEarnings = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + Number(item.vendorEarnings), 0);
    }, 0);

    res.json({
      totalOrders: orders.length,
      totalRevenue,
      totalCommission,
      totalVendorEarnings,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório' });
  }
};


// ==================== VENDOR APPROVAL MANAGEMENT ====================

// @desc    Get pending vendors
// @route   GET /api/admin/vendors/pending
// @access  Private/Admin
export const getPendingVendors = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const vendors = await prisma.user.findMany({
      where: {
        role: 'VENDOR',
        isApproved: false,
        isActive: true
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        storeName: true,
        storeDescription: true,
        address: true,
        city: true,
        province: true,
        isEmailVerified: true,
        createdAt: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    const total = await prisma.user.count({
      where: {
        role: 'VENDOR',
        isApproved: false,
        isActive: true
      }
    });

    res.json({
      vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get pending vendors error:', error);
    res.status(500).json({ message: 'Erro ao buscar vendedores pendentes' });
  }
};

// @desc    Approve vendor
// @route   PATCH /api/admin/vendors/:id/approve
// @access  Private/Admin
export const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true
      }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendedor não encontrado' });
    }

    if (vendor.role !== 'VENDOR') {
      return res.status(400).json({ message: 'Usuário não é um vendedor' });
    }

    if (vendor.isApproved) {
      return res.status(400).json({ message: 'Vendedor já está aprovado' });
    }

    const updatedVendor = await prisma.user.update({
      where: { id },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: req.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        storeName: true,
        isApproved: true,
        approvedAt: true
      }
    });

    // Criar notificação para o vendedor
    try {
      await prisma.notification.create({
        data: {
          userId: id,
          type: 'SYSTEM',
          title: '🎉 Conta Aprovada!',
          message: `Parabéns ${vendor.name}! Sua conta de vendedor foi aprovada. Agora você pode começar a vender seus produtos.`,
          link: '/vendedor/produtos'
        }
      });
    } catch (notifError) {
      console.error('❌ Erro ao criar notificação:', notifError);
    }

    res.json({
      message: 'Vendedor aprovado com sucesso',
      vendor: updatedVendor
    });
  } catch (error) {
    console.error('Approve vendor error:', error);
    res.status(500).json({ message: 'Erro ao aprovar vendedor' });
  }
};

// @desc    Reject vendor
// @route   PATCH /api/admin/vendors/:id/reject
// @access  Private/Admin
export const rejectVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const vendor = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true
      }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendedor não encontrado' });
    }

    if (vendor.role !== 'VENDOR') {
      return res.status(400).json({ message: 'Usuário não é um vendedor' });
    }

    // Desativar a conta
    const updatedVendor = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        isApproved: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        storeName: true,
        isActive: true,
        isApproved: true
      }
    });

    // Criar notificação para o vendedor
    try {
      await prisma.notification.create({
        data: {
          userId: id,
          type: 'SYSTEM',
          title: '❌ Conta Não Aprovada',
          message: `Olá ${vendor.name}, infelizmente sua conta de vendedor não foi aprovada. ${reason ? `Motivo: ${reason}` : 'Entre em contato com o suporte para mais informações.'}`,
          link: '/contato'
        }
      });
    } catch (notifError) {
      console.error('❌ Erro ao criar notificação:', notifError);
    }

    res.json({
      message: 'Vendedor rejeitado',
      vendor: updatedVendor
    });
  } catch (error) {
    console.error('Reject vendor error:', error);
    res.status(500).json({ message: 'Erro ao rejeitar vendedor' });
  }
};

// @desc    Get vendor approval statistics
// @route   GET /api/admin/vendors/stats
// @access  Private/Admin
export const getVendorApprovalStats = async (req, res) => {
  try {
    const totalVendors = await prisma.user.count({
      where: { role: 'VENDOR' }
    });

    const approvedVendors = await prisma.user.count({
      where: {
        role: 'VENDOR',
        isApproved: true
      }
    });

    const pendingVendors = await prisma.user.count({
      where: {
        role: 'VENDOR',
        isApproved: false,
        isActive: true
      }
    });

    const rejectedVendors = await prisma.user.count({
      where: {
        role: 'VENDOR',
        isApproved: false,
        isActive: false
      }
    });

    res.json({
      total: totalVendors,
      approved: approvedVendors,
      pending: pendingVendors,
      rejected: rejectedVendors
    });
  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
};
