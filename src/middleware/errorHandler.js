import { Prisma } from '@prisma/client';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for dev
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Prisma validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    const message = 'Erro de validação nos dados fornecidos';
    error = {
      statusCode: 400,
      message
    };
  }

  // Prisma unique constraint error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const message = 'Valor duplicado. Este registro já existe.';
      error = {
        statusCode: 400,
        message
      };
    }

    // Foreign key constraint error
    if (err.code === 'P2003') {
      const message = 'Referência inválida.';
      error = {
        statusCode: 400,
        message
      };
    }

    // Record not found
    if (err.code === 'P2025') {
      const message = 'Registro não encontrado.';
      error = {
        statusCode: 404,
        message
      };
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido.';
    error = {
      statusCode: 401,
      message
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado.';
    error = {
      statusCode: 401,
      message
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erro no servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
