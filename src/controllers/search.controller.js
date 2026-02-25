import prisma from '../config/prisma.js';

// @desc    Advanced search with filters
// @route   GET /api/search
// @access  Public
export const advancedSearch = async (req, res) => {
  try {
    const {
      q, // query string
      page = 1,
      limit = 20,
      categoryId,
      minPrice,
      maxPrice,
      brand,
      condition,
      status = 'ACTIVE',
      sortBy = 'relevance', // relevance, price_asc, price_desc, newest, popular, rating
      inStock = true
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      status: status || 'ACTIVE',
      isActive: true
    };

    // Search query
    if (q && q.trim()) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Brand filter
    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    // Condition filter
    if (condition) {
      where.condition = condition;
    }

    // Stock filter
    if (inStock === 'true' || inStock === true) {
      where.stock = { gt: 0 };
    }

    // Build orderBy clause
    let orderBy = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        orderBy = { totalSales: 'desc' };
        break;
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'relevance':
      default:
        // For relevance, we'll order by views and sales
        orderBy = [
          { totalSales: 'desc' },
          { views: 'desc' }
        ];
        break;
    }

    // Execute search
    const products = await prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            storeName: true,
            storeLogo: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Get total count
    const total = await prisma.product.count({ where });

    // Get aggregations for filters
    const aggregations = await getSearchAggregations(where);

    res.json({
      success: true,
      query: q,
      products,
      aggregations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar busca'
    });
  }
};

// Helper function to get aggregations
async function getSearchAggregations(baseWhere) {
  try {
    // Get all products matching base criteria (without price/brand filters)
    const whereForAgg = { ...baseWhere };
    delete whereForAgg.price;
    delete whereForAgg.brand;
    delete whereForAgg.condition;

    const products = await prisma.product.findMany({
      where: whereForAgg,
      select: {
        price: true,
        brand: true,
        condition: true,
        categoryId: true
      }
    });

    // Calculate price range
    const prices = products.map(p => parseFloat(p.price));
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0
    };

    // Get unique brands
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

    // Get conditions count
    const conditions = products.reduce((acc, p) => {
      acc[p.condition] = (acc[p.condition] || 0) + 1;
      return acc;
    }, {});

    // Get categories count
    const categories = await prisma.category.findMany({
      where: {
        products: {
          some: whereForAgg
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    return {
      priceRange,
      brands: brands.sort(),
      conditions,
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        count: c._count.products
      }))
    };
  } catch (error) {
    console.error('Error getting aggregations:', error);
    return {
      priceRange: { min: 0, max: 0 },
      brands: [],
      conditions: {},
      categories: []
    };
  }
}

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Public
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    // Search in products
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } }
        ],
        status: 'ACTIVE',
        isActive: true
      },
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        brand: true,
        price: true,
        images: true
      },
      orderBy: [
        { totalSales: 'desc' },
        { views: 'desc' }
      ]
    });

    // Search in categories
    const categories = await prisma.category.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        isActive: true
      },
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    res.json({
      success: true,
      suggestions: {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: p.price,
          image: p.images[0] || null,
          type: 'product'
        })),
        categories: categories.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          type: 'category'
        }))
      }
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar sugestões'
    });
  }
};

// @desc    Get popular searches
// @route   GET /api/search/popular
// @access  Public
export const getPopularSearches = async (req, res) => {
  try {
    // Get most viewed products
    const popularProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        isActive: true
      },
      take: 10,
      orderBy: [
        { views: 'desc' },
        { totalSales: 'desc' }
      ],
      select: {
        name: true,
        brand: true
      }
    });

    // Extract keywords
    const keywords = new Set();
    popularProducts.forEach(p => {
      if (p.brand) keywords.add(p.brand);
      // Add first word of product name
      const firstWord = p.name.split(' ')[0];
      if (firstWord.length > 3) keywords.add(firstWord);
    });

    res.json({
      success: true,
      keywords: Array.from(keywords).slice(0, 10)
    });
  } catch (error) {
    console.error('Popular searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar termos populares'
    });
  }
};

// @desc    Track search (for analytics)
// @route   POST /api/search/track
// @access  Public
export const trackSearch = async (req, res) => {
  try {
    const { query, resultsCount, userId } = req.body;

    // In a real app, you'd save this to a SearchHistory table
    // For now, we'll just acknowledge it
    console.log('Search tracked:', { query, resultsCount, userId });

    res.json({
      success: true,
      message: 'Busca registrada'
    });
  } catch (error) {
    console.error('Track search error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar busca'
    });
  }
};
