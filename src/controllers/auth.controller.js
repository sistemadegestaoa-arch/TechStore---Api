import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';
import { notifyWelcome } from '../utils/notificationHelper.js';

// @desc    Register customer
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'CUSTOMER',
        emailVerificationToken: verificationToken
      }
    });

    // Remove password from response
    delete user.password;

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
      console.log(`✅ Verification code sent to ${email}: ${verificationToken}`);
    } catch (error) {
      console.error('Error sending verification email:', error);
      console.log(`⚠️  Email failed, but you can use this code for testing: ${verificationToken}`);
    }

    // Generate token
    const token = generateToken(user.id);

    // Enviar notificação de boas-vindas
    try {
      await notifyWelcome(user.id, user.name);
    } catch (notifError) {
      console.error('❌ Erro ao enviar notificação de boas-vindas:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso. Verifique seu email.',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register vendor
// @route   POST /api/auth/register-vendor
// @access  Public
export const registerVendor = async (req, res, next) => {
  try {
    const { name, email, password, phone, storeName, storeDescription, address, city, province } = req.body;

    // Check if user exists
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Create vendor
    const vendor = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'VENDOR',
        storeName,
        storeDescription,
        address,
        city,
        province,
        emailVerificationToken: verificationToken,
        commissionRate: 8.00
      }
    });

    // Remove password from response
    delete vendor.password;

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
      console.log(`✅ Verification code sent to ${email}: ${verificationToken}`);
    } catch (error) {
      console.error('Error sending verification email:', error);
      console.log(`⚠️  Email failed, but you can use this code for testing: ${verificationToken}`);
    }

    // Generate token
    const token = generateToken(vendor.id);

    // Enviar notificação de boas-vindas
    try {
      await notifyWelcome(vendor.id, vendor.name);
    } catch (notifError) {
      console.error('❌ Erro ao enviar notificação de boas-vindas:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Cadastro de vendedor realizado com sucesso. Verifique seu email.',
      data: {
        user: vendor,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada. Entre em contato com o suporte.'
      });
    }

    // Remove password from response
    delete user.password;

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificação inválido'
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null
      }
    });

    res.json({
      success: true,
      message: 'Email verificado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Generate reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(email, user.name, resetToken);
      console.log(`✅ Password reset code sent to ${email}: ${resetToken}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      console.log(`⚠️  Email failed, but you can use this code for testing: ${resetToken}`);
      
      // NÃO remover o token do banco - permitir uso mesmo sem email
      // Comentado para permitir testes sem email configurado
      /*
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null
        }
      });

      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar email. Tente novamente.'
      });
      */
    }

    res.json({
      success: true,
      message: 'Email de redefinição enviado'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gte: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        storeName: true,
        storeDescription: true,
        storeLogo: true,
        commissionRate: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        country: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
