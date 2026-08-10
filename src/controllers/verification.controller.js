import prisma from '../config/prisma.js';
import { sendEmail } from '../utils/emailService.js';
import { notifyVerificationApproved, notifyVerificationRejected } from '../utils/notificationHelper.js';

// Limite de 1MB por documento (em base64, 1MB real ≈ 1.37MB de string)
const MAX_DOC_SIZE = 1.37 * 1024 * 1024;

const validateBase64Size = (base64String, fieldName) => {
  if (base64String && base64String.length > MAX_DOC_SIZE) {
    return `${fieldName} excede o limite de 1MB`;
  }
  return null;
};

// @desc    Submit vendor verification
// @route   POST /api/verifications
// @access  Private/Vendor
export const submitVerification = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { alvaraComercial, certidaoEmpresa, biProprietario, fotoProprietario } = req.body;

    // Verificar se usuário é vendedor
    if (req.user.role !== 'VENDOR') {
      return res.status(403).json({
        success: false,
        message: 'Apenas vendedores podem solicitar verificação'
      });
    }

    // Validar campos obrigatórios
    if (!alvaraComercial) {
      return res.status(400).json({ success: false, message: 'Alvará Comercial é obrigatório' });
    }
    if (!certidaoEmpresa) {
      return res.status(400).json({ success: false, message: 'Certidão da Empresa é obrigatória' });
    }
    if (!biProprietario) {
      return res.status(400).json({ success: false, message: 'BI do Proprietário é obrigatório' });
    }
    if (!fotoProprietario) {
      return res.status(400).json({ success: false, message: 'Foto do Proprietário é obrigatória' });
    }

    // Validar tamanho de cada documento (máx 1MB)
    const sizeErrors = [
      validateBase64Size(alvaraComercial, 'Alvará Comercial'),
      validateBase64Size(certidaoEmpresa, 'Certidão da Empresa'),
      validateBase64Size(biProprietario, 'BI do Proprietário'),
      validateBase64Size(fotoProprietario, 'Foto do Proprietário'),
    ].filter(Boolean);

    if (sizeErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: sizeErrors[0]
      });
    }

    // Verificar se já existe verificação
    const existing = await prisma.vendorVerification.findUnique({
      where: { vendorId }
    });

    if (existing && existing.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma solicitação de verificação pendente'
      });
    }

    if (existing && existing.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Vendedor já está verificado'
      });
    }

    // Criar ou atualizar verificação
    const verification = await prisma.vendorVerification.upsert({
      where: { vendorId },
      create: {
        vendorId,
        alvaraComercial,
        certidaoEmpresa,
        biProprietario,
        fotoProprietario,
        status: 'PENDING'
      },
      update: {
        alvaraComercial,
        certidaoEmpresa,
        biProprietario,
        fotoProprietario,
        status: 'PENDING',
        rejectionReason: null
      }
    });

    // Enviar email de confirmação
    try {
      await sendEmail({
        to: req.user.email,
        subject: 'Solicitação de Verificação Recebida - TechStore',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">Solicitação Recebida!</h2>
            <p>Olá, ${req.user.name}!</p>
            <p>Recebemos a sua solicitação de verificação de vendedor com os seguintes documentos:</p>
            <ul>
              <li>✅ Alvará Comercial</li>
              <li>✅ Certidão da Empresa</li>
              <li>✅ BI do Proprietário</li>
              <li>✅ Foto do Proprietário</li>
            </ul>
            <p>A nossa equipa irá analisar os seus documentos e retornaremos em até 48 horas úteis.</p>
            <p style="color: #666; font-size: 14px;">
              Atenciosamente,<br>
              Equipe TechStore
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Solicitação de verificação enviada com sucesso',
      verification
    });
  } catch (error) {
    console.error('Erro ao enviar verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar verificação'
    });
  }
};

// @desc    Get vendor verification status
// @route   GET /api/verifications/my-status
// @access  Private/Vendor
export const getMyVerificationStatus = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const verification = await prisma.vendorVerification.findUnique({
      where: { vendorId },
      include: {
        vendor: {
          select: { id: true, name: true, email: true, storeName: true }
        }
      }
    });

    if (!verification) {
      return res.json({
        success: true,
        verification: null,
        message: 'Nenhuma solicitação de verificação encontrada'
      });
    }

    res.json({ success: true, verification });
  } catch (error) {
    console.error('Erro ao buscar verificação:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar verificação' });
  }
};

// @desc    Get all verifications (Admin)
// @route   GET /api/verifications
// @access  Private/Admin
export const getAllVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const where = status ? { status } : {};

    const [verifications, total] = await Promise.all([
      prisma.vendorVerification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: { id: true, name: true, email: true, storeName: true, phone: true }
          }
        }
      }),
      prisma.vendorVerification.count({ where })
    ]);

    res.json({
      success: true,
      verifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar verificações:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar verificações' });
  }
};

// @desc    Approve verification (Admin)
// @route   PATCH /api/verifications/:id/approve
// @access  Private/Admin
export const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;

    const verification = await prisma.vendorVerification.update({
      where: { id },
      data: {
        status: 'APPROVED',
        verifiedAt: new Date(),
        verifiedBy: req.user.id,
        rejectionReason: null
      },
      include: { vendor: true }
    });

    // Aprovar o vendedor na tabela users
    await prisma.user.update({
      where: { id: verification.vendorId },
      data: { isApproved: true, approvedAt: new Date(), approvedBy: req.user.id }
    });

    try {
      await sendEmail({
        to: verification.vendor.email,
        subject: '✅ Verificação Aprovada - TechStore',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Parabéns! A sua verificação foi aprovada!</h2>
            <p>Olá, ${verification.vendor.name}!</p>
            <p>A sua solicitação de verificação foi aprovada com sucesso!</p>
            <p>Agora pode adicionar produtos à loja e começar a vender.</p>
            <p style="color: #666; font-size: 14px;">Atenciosamente,<br>Equipe TechStore</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
    }

    try {
      await notifyVerificationApproved(verification.vendorId);
    } catch (notifError) {
      console.error('Erro ao enviar notificação:', notifError);
    }

    res.json({ success: true, message: 'Verificação aprovada com sucesso', verification });
  } catch (error) {
    console.error('Erro ao aprovar verificação:', error);
    res.status(500).json({ success: false, message: 'Erro ao aprovar verificação' });
  }
};

// @desc    Reject verification (Admin)
// @route   PATCH /api/verifications/:id/reject
// @access  Private/Admin
export const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Motivo da rejeição é obrigatório' });
    }

    const verification = await prisma.vendorVerification.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason, verifiedBy: req.user.id },
      include: { vendor: true }
    });

    try {
      await sendEmail({
        to: verification.vendor.email,
        subject: 'Verificação Não Aprovada - TechStore',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Verificação Não Aprovada</h2>
            <p>Olá, ${verification.vendor.name}!</p>
            <p>Infelizmente, a sua solicitação de verificação não foi aprovada.</p>
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>Motivo:</strong>
              <p>${reason}</p>
            </div>
            <p>Pode corrigir as informações e enviar uma nova solicitação.</p>
            <p style="color: #666; font-size: 14px;">Atenciosamente,<br>Equipe TechStore</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
    }

    try {
      await notifyVerificationRejected(verification.vendorId, reason);
    } catch (notifError) {
      console.error('Erro ao enviar notificação:', notifError);
    }

    res.json({ success: true, message: 'Verificação rejeitada', verification });
  } catch (error) {
    console.error('Erro ao rejeitar verificação:', error);
    res.status(500).json({ success: false, message: 'Erro ao rejeitar verificação' });
  }
};

// @desc    Delete verification (Admin)
// @route   DELETE /api/verifications/:id
// @access  Private/Admin
export const deleteVerification = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.vendorVerification.delete({ where: { id } });
    res.json({ success: true, message: 'Verificação deletada' });
  } catch (error) {
    console.error('Erro ao deletar verificação:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar verificação' });
  }
};
