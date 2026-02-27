import prisma from '../config/prisma.js';

// @desc    Create review
// @route   POST /api/reviews
// @access  Private/Customer
export const createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment, images = [] } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ message: 'Produto e avaliação são obrigatórios' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Avaliação deve ser entre 1 e 5' });
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Verificar se o cliente já avaliou este produto
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        customerId: req.user.id
      }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'Você já avaliou este produto' });
    }

    // Verificar se o cliente comprou o produto
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId: req.user.id,
          status: 'DELIVERED'
        }
      }
    });

    // Criar avaliação
    const review = await prisma.review.create({
      data: {
        productId,
        customerId: req.user.id,
        rating,
        title,
        comment,
        images,
        isVerifiedPurchase: !!hasPurchased
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Atualizar estatísticas do produto
    const reviews = await prisma.review.findMany({
      where: { productId, isApproved: true }
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    await prisma.product.update({
      where: { id: productId },
      data: {
        totalReviews,
        averageRating
      }
    });

    res.status(201).json({
      message: 'Avaliação criada com sucesso',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Erro ao criar avaliação' });
  }
};

// @desc    Get product reviews
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      productId,
      isApproved: true
    };

    if (rating) {
      where.rating = parseInt(rating);
    }

    const reviews = await prisma.review.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    const total = await prisma.review.count({ where });

    // Estatísticas de avaliações
    const stats = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId, isApproved: true },
      _count: { rating: true }
    });

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    stats.forEach(stat => {
      ratingDistribution[stat.rating] = stat._count.rating;
    });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        ratingDistribution,
        totalReviews: total
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ message: 'Erro ao buscar avaliações' });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private/Customer
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, images } = req.body;

    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }

    // Verificar se o usuário é o dono da avaliação
    if (review.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Avaliação deve ser entre 1 e 5' });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        ...(rating && { rating }),
        ...(title !== undefined && { title }),
        ...(comment !== undefined && { comment }),
        ...(images !== undefined && { images })
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Atualizar estatísticas do produto
    const reviews = await prisma.review.findMany({
      where: { productId: review.productId, isApproved: true }
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        totalReviews,
        averageRating
      }
    });

    res.json({
      message: 'Avaliação atualizada com sucesso',
      review: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Erro ao atualizar avaliação' });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private/Customer
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }

    // Verificar se o usuário é o dono da avaliação
    if (review.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    await prisma.review.delete({ where: { id } });

    // Atualizar estatísticas do produto
    const reviews = await prisma.review.findMany({
      where: { productId: review.productId, isApproved: true }
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        totalReviews,
        averageRating
      }
    });

    res.json({ message: 'Avaliação deletada com sucesso' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Erro ao deletar avaliação' });
  }
};

// @desc    Get customer reviews
// @route   GET /api/reviews/my-reviews
// @access  Private/Customer
export const getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const reviews = await prisma.review.findMany({
      where: { customerId: req.user.id },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true
          }
        }
      }
    });

    const total = await prisma.review.count({
      where: { customerId: req.user.id }
    });

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
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Erro ao buscar avaliações' });
  }
};
