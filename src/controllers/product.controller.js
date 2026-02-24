import prisma from '../config/prisma.js';
import { notifyNewProduct } from './newsletter.controller.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// @desc    Get all products (with filters)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      status,
      vendorId,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (category) {
      where.categoryId = category;
    }

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get products
    const products = await prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: order },
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
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            storeName: true,
            storeDescription: true,
            storeLogo: true,
            address: true,
            city: true,
            province: true,
            country: true
          }
        },
        category: true,
        reviews: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Increment views
    await prisma.product.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Erro ao buscar produto' });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Vendor
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      comparePrice,
      sku,
      stock,
      lowStockThreshold,
      brand,
      condition,
      categoryId,
      specifications,
      weight,
      dimensions
    } = req.body;

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingSku) {
      return res.status(400).json({ message: 'SKU já existe' });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, 'products');
        images.push(result.secure_url);
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        sku,
        stock: parseInt(stock),
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 10,
        brand,
        condition: condition || 'NEW',
        status: 'ACTIVE',
        images,
        specifications: specifications ? JSON.parse(specifications) : null,
        weight: weight ? parseFloat(weight) : null,
        dimensions: dimensions ? JSON.parse(dimensions) : null,
        vendorId: req.user.id,
        categoryId
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            storeName: true
          }
        },
        category: true
      }
    });

    // Notificar inscritos da newsletter sobre novo produto (apenas se ACTIVE)
    if (product.status === 'ACTIVE') {
      console.log('🔔 Produto ACTIVE criado, iniciando notificação...');
      notifyNewProduct(product).catch(err => 
        console.error('❌ Erro ao notificar novo produto:', err)
      );
    } else {
      console.log('⚠️ Produto criado com status', product.status, '- notificação não enviada');
    }

    res.status(201).json({
      message: 'Produto criado com sucesso',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Erro ao criar produto' });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Vendor
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      comparePrice,
      stock,
      lowStockThreshold,
      brand,
      condition,
      status,
      categoryId,
      specifications,
      weight,
      dimensions
    } = req.body;

    // Check if product exists and belongs to vendor
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    if (existingProduct.vendorId !== req.user.id) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    // Handle new image uploads
    let images = existingProduct.images;
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, 'products');
        newImages.push(result.secure_url);
      }
      images = [...images, ...newImages];
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name || existingProduct.name,
        description: description || existingProduct.description,
        price: price ? parseFloat(price) : existingProduct.price,
        comparePrice: comparePrice ? parseFloat(comparePrice) : existingProduct.comparePrice,
        stock: stock !== undefined ? parseInt(stock) : existingProduct.stock,
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : existingProduct.lowStockThreshold,
        brand: brand || existingProduct.brand,
        condition: condition || existingProduct.condition,
        status: status || existingProduct.status,
        images,
        specifications: specifications ? JSON.parse(specifications) : existingProduct.specifications,
        weight: weight ? parseFloat(weight) : existingProduct.weight,
        dimensions: dimensions ? JSON.parse(dimensions) : existingProduct.dimensions,
        categoryId: categoryId || existingProduct.categoryId
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            storeName: true
          }
        },
        category: true
      }
    });

    res.json({
      message: 'Produto atualizado com sucesso',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Erro ao atualizar produto' });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Vendor
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists and belongs to vendor
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    if (product.vendorId !== req.user.id) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    // Delete images from Cloudinary
    for (const imageUrl of product.images) {
      try {
        await deleteFromCloudinary(imageUrl);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    // Delete product
    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Erro ao deletar produto' });
  }
};

// @desc    Get vendor products
// @route   GET /api/products/vendor/my-products
// @access  Private/Vendor
export const getVendorProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      status,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      vendorId: req.user.id
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get products
    const products = await prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: order },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get total count
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
    console.error('Get vendor products error:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
};

// @desc    Update product status
// @route   PATCH /api/products/:id/status
// @access  Private/Vendor
export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'OUT_OF_STOCK'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    // Check if product exists and belongs to vendor
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    if (product.vendorId !== req.user.id) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    // Update status
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { status }
    });

    res.json({
      message: 'Status atualizado com sucesso',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
};
