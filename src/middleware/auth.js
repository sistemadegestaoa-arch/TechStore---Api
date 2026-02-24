import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado. Token não fornecido.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true
        }
      });

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado.'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Conta desativada.'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor.'
    });
  }
};

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado. Função ${req.user.role} não autorizada.`
      });
    }
    next();
  };
};

// Check if user is vendor
export const isVendor = (req, res, next) => {
  if (req.user.role !== 'VENDOR' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acesso permitido apenas para vendedores.'
    });
  }
  next();
};

// Check if user is customer
export const isCustomer = (req, res, next) => {
  if (req.user.role !== 'CUSTOMER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acesso permitido apenas para clientes.'
    });
  }
  next();
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acesso permitido apenas para administradores.'
    });
  }
  next();
};
