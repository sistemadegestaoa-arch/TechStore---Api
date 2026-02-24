import { body, param, query, validationResult } from 'express-validator';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório').isLength({ min: 2, max: 100 }),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('phone').optional().isMobilePhone('any').withMessage('Telefone inválido')
];

export const loginValidation = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Senha é obrigatória')
];

export const vendorRegisterValidation = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('storeName').trim().notEmpty().withMessage('Nome da loja é obrigatório'),
  body('storeDescription').optional().trim(),
  body('phone').notEmpty().withMessage('Telefone é obrigatório')
];

// Product validation rules
export const createProductValidation = [
  body('name').trim().notEmpty().withMessage('Nome do produto é obrigatório').isLength({ min: 3, max: 200 }),
  body('description').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('price').isFloat({ min: 0 }).withMessage('Preço deve ser maior que zero'),
  body('sku').trim().notEmpty().withMessage('SKU é obrigatório'),
  body('stock').isInt({ min: 0 }).withMessage('Estoque deve ser maior ou igual a zero'),
  body('categoryId').notEmpty().withMessage('Categoria é obrigatória'),
  body('condition').optional().isIn(['new', 'used', 'refurbished']).withMessage('Condição inválida')
];

export const updateProductValidation = [
  body('name').optional().trim().isLength({ min: 3, max: 200 }),
  body('description').optional().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('condition').optional().isIn(['new', 'used', 'refurbished'])
];

// Order validation rules
export const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Pedido deve conter pelo menos um item'),
  body('items.*.productId').notEmpty().withMessage('ID do produto é obrigatório'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser maior que zero'),
  body('shippingAddress').trim().notEmpty().withMessage('Endereço de entrega é obrigatório'),
  body('shippingCity').trim().notEmpty().withMessage('Cidade é obrigatória'),
  body('shippingProvince').trim().notEmpty().withMessage('Província é obrigatória'),
  body('shippingPhone').trim().notEmpty().withMessage('Telefone é obrigatório'),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'bank_transfer', 'cash_on_delivery', 'mobile_money']).withMessage('Método de pagamento inválido')
];

// Review validation rules
export const createReviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Avaliação deve ser entre 1 e 5'),
  body('comment').trim().notEmpty().withMessage('Comentário é obrigatório').isLength({ min: 10 }).withMessage('Comentário deve ter no mínimo 10 caracteres'),
  body('title').optional().trim()
];

// UUID validation
export const uuidValidation = [
  param('id').isUUID().withMessage('ID inválido')
];
