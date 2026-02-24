import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import { deleteFromCloudinary, getPublicIdFromUrl } from '../middleware/cloudinaryUpload.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res, next) => {
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
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, city, province, postalCode, country } = req.body;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Prepare update data
    const updateData = {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(city && { city }),
      ...(province && { province }),
      ...(postalCode && { postalCode }),
      ...(country && { country })
    };

    // Add avatar if file was uploaded to Cloudinary
    if (req.file) {
      // Delete old avatar from Cloudinary if exists
      if (userExists.avatar) {
        const oldPublicId = getPublicIdFromUrl(userExists.avatar);
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId);
        }
      }
      
      // Save new Cloudinary URL
      updateData.avatar = req.file.path;
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
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
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor profile
// @route   PUT /api/users/vendor-profile
// @access  Private (Vendor only)
export const updateVendorProfile = async (req, res, next) => {
  try {
    const { 
      name, 
      phone, 
      address, 
      city, 
      province, 
      postalCode, 
      country,
      storeName,
      storeDescription,
      bankName,
      bankAccountNumber,
      bankAccountHolder
    } = req.body;

    // Check if user is vendor
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (user.role !== 'VENDOR') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas vendedores podem atualizar perfil de vendedor'
      });
    }

    // Prepare update data
    const updateData = {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(city && { city }),
      ...(province && { province }),
      ...(postalCode && { postalCode }),
      ...(country && { country }),
      ...(storeName && { storeName }),
      ...(storeDescription && { storeDescription }),
      ...(bankName && { bankName }),
      ...(bankAccountNumber && { bankAccountNumber }),
      ...(bankAccountHolder && { bankAccountHolder })
    };

    // Add storeLogo if file was uploaded to Cloudinary
    if (req.file) {
      // Delete old logo from Cloudinary if exists
      if (user.storeLogo) {
        const oldPublicId = getPublicIdFromUrl(user.storeLogo);
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId);
        }
      }
      
      // Save new Cloudinary URL
      updateData.storeLogo = req.file.path;
    }

    // Update vendor
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
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
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil de vendedor atualizado com sucesso',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account
// @route   DELETE /api/users/account
// @access  Private
export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Senha é obrigatória para deletar conta'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: req.user.id }
    });

    res.json({
      success: true,
      message: 'Conta deletada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
