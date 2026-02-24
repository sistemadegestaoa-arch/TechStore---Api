import prisma from '../config/prisma.js';

// @desc    Add product to favorites
// @route   POST /api/favorites/:productId
// @access  Private
export const addFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'Produto já está nos favoritos' });
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId
      },
      include: {
        product: {
          include: {
            category: { select: { name: true } },
            vendor: { select: { name: true, storeName: true } }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Produto adicionado aos favoritos',
      favorite
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Erro ao adicionar aos favoritos' });
  }
};

// @desc    Remove product from favorites
// @route   DELETE /api/favorites/:productId
// @access  Private
export const removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Produto não está nos favoritos' });
    }

    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    res.json({ message: 'Produto removido dos favoritos' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Erro ao remover dos favoritos' });
  }
};

// @desc    Get user favorites
// @route   GET /api/favorites
// @access  Private
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
            vendor: { select: { id: true, name: true, storeName: true } }
          }
        }
      }
    });

    const total = await prisma.favorite.count({ where: { userId } });

    res.json({
      favorites: favorites.map(fav => fav.product),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Erro ao buscar favoritos' });
  }
};

// @desc    Check if product is favorited
// @route   GET /api/favorites/check/:productId
// @access  Private
export const checkFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ message: 'Erro ao verificar favorito' });
  }
};

// @desc    Toggle favorite (add or remove)
// @route   POST /api/favorites/toggle/:productId
// @access  Private
export const toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingFavorite) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      });

      return res.json({
        message: 'Produto removido dos favoritos',
        isFavorite: false
      });
    } else {
      // Add to favorites
      await prisma.favorite.create({
        data: {
          userId,
          productId
        }
      });

      return res.json({
        message: 'Produto adicionado aos favoritos',
        isFavorite: true
      });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Erro ao alternar favorito' });
  }
};

// @desc    Get favorites count
// @route   GET /api/favorites/count
// @access  Private
export const getFavoritesCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await prisma.favorite.count({
      where: { userId }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get favorites count error:', error);
    res.status(500).json({ message: 'Erro ao contar favoritos' });
  }
};
