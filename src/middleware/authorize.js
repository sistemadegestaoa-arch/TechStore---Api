// Middleware to check user roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado. Apenas ${roles.join(', ')} podem acessar este recurso`
      });
    }

    next();
  };
};

// Check if user is vendor
export const isVendor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado'
    });
  }

  if (req.user.role !== 'VENDOR') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas vendedores podem acessar este recurso'
    });
  }

  next();
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar este recurso'
    });
  }

  next();
};

// Check if user is customer
export const isCustomer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado'
    });
  }

  if (req.user.role !== 'CUSTOMER') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas clientes podem acessar este recurso'
    });
  }

  next();
};

// Check if user owns the resource or is admin
export const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado'
    });
  }

  const resourceUserId = req.params.userId || req.body.userId;
  
  if (req.user.role === 'ADMIN' || req.user.id === resourceUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Acesso negado. Você não tem permissão para acessar este recurso'
  });
};
