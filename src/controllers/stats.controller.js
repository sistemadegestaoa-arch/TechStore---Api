import prisma from '../config/prisma.js';

// @desc    Get public statistics
// @route   GET /api/stats/public
// @access  Public
export const getPublicStats = async (req, res) => {
  try {
    console.log('📊 Buscando estatísticas públicas...');

    // Contar clientes (usuários com role CUSTOMER)
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER', isActive: true }
    });

    // Contar produtos ativos
    const totalProducts = await prisma.product.count({
      where: { status: 'ACTIVE' }
    });

    // Contar pedidos entregues
    const totalOrders = await prisma.order.count({
      where: { status: 'DELIVERED' }
    });

    // Contar vendedores ativos
    const totalVendors = await prisma.user.count({
      where: { role: 'VENDOR', isActive: true }
    });

    // Calcular taxa de satisfação (baseado em avaliações)
    const reviews = await prisma.review.aggregate({
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    });

    // Converter média de rating (1-5) para porcentagem
    const satisfactionRate = reviews._avg.rating 
      ? Math.round((reviews._avg.rating / 5) * 100) 
      : 98; // Valor padrão se não houver avaliações

    const stats = {
      totalCustomers,
      totalProducts,
      totalOrders,
      totalVendors,
      satisfactionRate,
      totalReviews: reviews._count.rating
    };

    console.log('✅ Estatísticas públicas:', stats);

    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas públicas:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar estatísticas',
      error: error.message 
    });
  }
};
