import prisma from '../config/prisma.js';

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Sales overview
    const orders = await prisma.order.findMany({
      where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
      select: {
        total: true,
        status: true,
        createdAt: true
      }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

    // Products stats
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({ where: { status: 'ACTIVE' } });
    const outOfStock = await prisma.product.count({ where: { stock: 0 } });

    // Users stats
    const totalUsers = await prisma.user.count();
    const customers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const vendors = await prisma.user.count({ where: { role: 'VENDOR' } });

    // Top products
    const topProducts = await prisma.product.findMany({
      take: 10,
      orderBy: { totalSales: 'desc' },
      select: {
        id: true,
        name: true,
        totalSales: true,
        price: true,
        images: true
      }
    });

    // Revenue by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'DELIVERED'
      },
      select: {
        total: true,
        createdAt: true
      }
    });

    // Group by date
    const revenueByDay = recentOrders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + parseFloat(order.total);
      return acc;
    }, {});

    res.json({
      success: true,
      analytics: {
        overview: {
          totalRevenue,
          totalOrders: orders.length,
          completedOrders,
          pendingOrders,
          cancelledOrders,
          averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          outOfStock
        },
        users: {
          total: totalUsers,
          customers,
          vendors
        },
        topProducts,
        revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({
          date,
          revenue
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar analytics'
    });
  }
};

// @desc    Get vendor analytics
// @route   GET /api/analytics/vendor
// @access  Private/Vendor
export const getVendorAnalytics = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Get vendor's order items
    const orderItems = await prisma.orderItem.findMany({
      where: {
        vendorId,
        ...(dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {})
      },
      include: {
        order: {
          select: {
            status: true,
            createdAt: true
          }
        },
        product: {
          select: {
            name: true,
            images: true
          }
        }
      }
    });

    // Calculate metrics
    const totalRevenue = orderItems.reduce((sum, item) => 
      sum + parseFloat(item.vendorEarnings), 0
    );

    const totalSales = orderItems.length;

    const completedSales = orderItems.filter(item => 
      item.order.status === 'DELIVERED'
    ).length;

    // Products stats
    const products = await prisma.product.findMany({
      where: { vendorId },
      select: {
        id: true,
        name: true,
        stock: true,
        totalSales: true,
        averageRating: true,
        views: true
      }
    });

    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock < 10).length;

    // Top selling products
    const topProducts = products
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    // Revenue by day
    const revenueByDay = orderItems.reduce((acc, item) => {
      const date = item.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + parseFloat(item.vendorEarnings);
      return acc;
    }, {});

    res.json({
      success: true,
      analytics: {
        overview: {
          totalRevenue,
          totalSales,
          completedSales,
          averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts
        },
        topProducts,
        revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({
          date,
          revenue
        }))
      }
    });
  } catch (error) {
    console.error('Vendor analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar analytics'
    });
  }
};

// @desc    Get product analytics
// @route   GET /api/analytics/products/:id
// @access  Private
export const getProductAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            order: {
              select: {
                createdAt: true,
                status: true
              }
            }
          }
        },
        reviews: {
          select: {
            rating: true,
            createdAt: true
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

    // Sales by day
    const salesByDay = product.orderItems.reduce((acc, item) => {
      const date = item.order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + item.quantity;
      return acc;
    }, {});

    // Revenue by day
    const revenueByDay = product.orderItems.reduce((acc, item) => {
      const date = item.order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + parseFloat(item.subtotal);
      return acc;
    }, {});

    // Rating distribution
    const ratingDistribution = product.reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      analytics: {
        product: {
          id: product.id,
          name: product.name,
          views: product.views,
          totalSales: product.totalSales,
          averageRating: product.averageRating,
          totalReviews: product.totalReviews,
          stock: product.stock
        },
        salesByDay: Object.entries(salesByDay).map(([date, quantity]) => ({
          date,
          quantity
        })),
        revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({
          date,
          revenue
        })),
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar analytics do produto'
    });
  }
};

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private/Admin
export const getCustomerAnalytics = async (req, res) => {
  try {
    // New customers by month
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        createdAt: true,
        orders: {
          select: {
            total: true,
            status: true
          }
        }
      }
    });

    // Customer lifetime value
    const customerLTV = customers.map(customer => {
      const totalSpent = customer.orders
        .filter(o => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + parseFloat(o.total), 0);
      
      return {
        totalSpent,
        orderCount: customer.orders.length
      };
    });

    const averageLTV = customerLTV.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length;
    const averageOrders = customerLTV.reduce((sum, c) => sum + c.orderCount, 0) / customers.length;

    // New customers by month
    const customersByMonth = customers.reduce((acc, customer) => {
      const month = customer.createdAt.toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      analytics: {
        totalCustomers: customers.length,
        averageLTV,
        averageOrders,
        customersByMonth: Object.entries(customersByMonth).map(([month, count]) => ({
          month,
          count
        }))
      }
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar analytics de clientes'
    });
  }
};

// @desc    Export analytics data
// @route   GET /api/analytics/export
// @access  Private/Admin
export const exportAnalytics = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    let data = [];

    switch (type) {
      case 'orders':
        data = await prisma.order.findMany({
          where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : {},
          include: {
            customer: {
              select: { name: true, email: true }
            },
            items: {
              include: {
                product: {
                  select: { name: true }
                }
              }
            }
          }
        });
        break;

      case 'products':
        data = await prisma.product.findMany({
          include: {
            vendor: {
              select: { name: true, storeName: true }
            },
            category: {
              select: { name: true }
            }
          }
        });
        break;

      case 'customers':
        data = await prisma.user.findMany({
          where: { role: 'CUSTOMER' },
          include: {
            orders: true
          }
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de exportação inválido'
        });
    }

    res.json({
      success: true,
      data,
      exportedAt: new Date(),
      type
    });
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar dados'
    });
  }
};
