import prisma from '../config/prisma.js';

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Public
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal, categoryId, vendorId, userId } = req.body;

    if (!code || !cartTotal) {
      return res.status(400).json({
        success: false,
        message: 'Código do cupom e valor do carrinho são obrigatórios'
      });
    }

    // Buscar cupom
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado'
      });
    }

    // Validações
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cupom inativo'
      });
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      return res.status(400).json({
        success: false,
        message: 'Cupom ainda não está válido'
      });
    }

    if (now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Cupom expirado'
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Cupom atingiu o limite de uso'
      });
    }

    if (coupon.minPurchase && parseFloat(cartTotal) < parseFloat(coupon.minPurchase)) {
      return res.status(400).json({
        success: false,
        message: `Valor mínimo de compra: ${coupon.minPurchase} AOA`
      });
    }

    // Verificar restrições
    if (coupon.categoryId && coupon.categoryId !== categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Cupom não válido para esta categoria'
      });
    }

    if (coupon.vendorId && coupon.vendorId !== vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Cupom não válido para este vendedor'
      });
    }

    // Verificar primeira compra
    if (coupon.firstPurchaseOnly && userId) {
      const orderCount = await prisma.order.count({
        where: { customerId: userId }
      });

      if (orderCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cupom válido apenas para primeira compra'
        });
      }
    }

    // Calcular desconto
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (parseFloat(cartTotal) * parseFloat(coupon.value)) / 100;
      if (coupon.maxDiscount && discount > parseFloat(coupon.maxDiscount)) {
        discount = parseFloat(coupon.maxDiscount);
      }
    } else if (coupon.type === 'FIXED') {
      discount = parseFloat(coupon.value);
    } else if (coupon.type === 'FREE_SHIPPING') {
      discount = 0; // Será aplicado no frete
    }

    res.json({
      success: true,
      message: 'Cupom válido',
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: discount.toFixed(2),
        description: coupon.description
      }
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar cupom'
    });
  }
};

// @desc    Create coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      value,
      minPurchase,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      categoryId,
      vendorId,
      firstPurchaseOnly
    } = req.body;

    // Validações
    if (!code || !type || !value || !validFrom || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando'
      });
    }

    // Verificar se código já existe
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Código de cupom já existe'
      });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        type,
        value: parseFloat(value),
        minPurchase: minPurchase ? parseFloat(minPurchase) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        categoryId: categoryId || null,
        vendorId: vendorId || null,
        firstPurchaseOnly: firstPurchaseOnly || false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cupom criado com sucesso',
      coupon
    });
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar cupom'
    });
  }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
export const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const coupons = await prisma.coupon.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.coupon.count({ where });

    res.json({
      success: true,
      coupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar cupons:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar cupons'
    });
  }
};

// @desc    Update coupon (Admin)
// @route   PATCH /api/coupons/:id
// @access  Private/Admin
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Converter valores numéricos
    if (updateData.value) updateData.value = parseFloat(updateData.value);
    if (updateData.minPurchase) updateData.minPurchase = parseFloat(updateData.minPurchase);
    if (updateData.maxDiscount) updateData.maxDiscount = parseFloat(updateData.maxDiscount);
    if (updateData.usageLimit) updateData.usageLimit = parseInt(updateData.usageLimit);

    // Converter datas
    if (updateData.validFrom) updateData.validFrom = new Date(updateData.validFrom);
    if (updateData.validUntil) updateData.validUntil = new Date(updateData.validUntil);

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Cupom atualizado com sucesso',
      coupon
    });
  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar cupom'
    });
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.coupon.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Cupom deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar cupom'
    });
  }
};

// @desc    Increment coupon usage
// @route   POST /api/coupons/:id/use
// @access  Private
export const useCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        usedCount: {
          increment: 1
        }
      }
    });

    res.json({
      success: true,
      message: 'Cupom utilizado',
      coupon
    });
  } catch (error) {
    console.error('Erro ao usar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao usar cupom'
    });
  }
};
