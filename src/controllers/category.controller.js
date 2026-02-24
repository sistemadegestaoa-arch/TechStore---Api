import prisma from '../config/prisma.js';
import { notifyNewCategory } from './newsletter.controller.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const { isActive } = req.query;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Erro ao buscar categorias' });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { status: 'ACTIVE' },
          take: 12,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Erro ao buscar categoria' });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    });

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

    // Notificar vendedores sobre nova categoria
    console.log('🔔 Categoria criada, iniciando notificação para vendedores...');
    notifyNewCategory(category).catch(err => 
      console.error('❌ Erro ao notificar nova categoria:', err)
    );

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
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;

    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    // Generate new slug if name changed
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name || category.name,
        slug,
        description: description !== undefined ? description : category.description,
        icon: icon || category.icon,
        isActive: isActive !== undefined ? isActive : category.isActive
      }
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
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    if (category._count.products > 0) {
      return res.status(400).json({
        message: 'Não é possível deletar categoria com produtos associados'
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Erro ao deletar categoria' });
  }
};
