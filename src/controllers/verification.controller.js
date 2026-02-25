import prisma from '../config/prisma.js';
import { sendEmail } from '../utils/emailService.js';

// @desc    Submit vendor verification
// @route   POST /api/verifications
// @access  Private/Vendor
export const submitVerification = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { documentType, documentNumber, documentImage, bankStatement } = req.body;

    // Verificar se usuário é vendedor
    if (req.user.role !== 'VENDOR') {
      return res.status(403).json({
        success: false,
        message: 'Apenas vendedores podem solicitar verificação'
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
        documentType,
        documentNumber,
        documentImage: documentImage || null,
        bankStatement: bankStatement || null,
        status: 'PENDING'
      },
      update: {
        documentType,
        documentNumber,
        documentImage: documentImage || null,
        bankStatement: bankStatement || null,
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
            <p>Recebemos sua solicitação de verificação de vendedor.</p>
            <p>Nossa equipe irá analisar seus documentos e retornaremos em até 48 horas úteis.</p>
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
          select: {
            id: true,
            name: true,
            email: true,
            storeName: true
          }
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

    res.json({
      success: true,
      verification
    });
  } catch (error) {
    console.error('Erro ao buscar verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar verificação'
    });
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

    const where = {};
    if (status) {
      where.status = status;
    }

    const verifications = await prisma.vendorVerification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            storeName: true,
            phone: true
          }
        }
      }
    });

    const total = await prisma.vendorVerification.count({ where });

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
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar verificações'
    });
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
      include: {
        vendor: true
      }
    });

    // Enviar email de aprovação
    try {
      await sendEmail({
        to: verification.vendor.email,
        subject: '✅ Verificação Aprovada - TechStore',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Parabéns! Você foi verificado!</h2>
            <p>Olá, ${verification.vendor.name}!</p>
            <p>Sua solicitação de verificação foi aprovada com sucesso!</p>
            <p>Agora você tem o selo de vendedor verificado e pode aproveitar todos os benefícios:</p>
            <ul>
              <li>✅ Maior visibilidade nos resultados de busca</li>
              <li>✅ Badge de vendedor verificado</li>
              <li>✅ Maior confiança dos clientes</li>
              <li>✅ Prioridade no suporte</li>
            </ul>
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

    res.json({
      success: true,
      message: 'Verificação aprovada com sucesso',
      verification
    });
  } catch (error) {
    console.error('Erro ao aprovar verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar verificação'
    });
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
      return res.status(400).json({
        success: false,
        message: 'Motivo da rejeição é obrigatório'
      });
    }

    const verification = await prisma.vendorVerification.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        verifiedBy: req.user.id
      },
      include: {
        vendor: true
      }
    });

    // Enviar email de rejeição
    try {
      await sendEmail({
        to: verification.vendor.email,
        subject: 'Verificação Não Aprovada - TechStore',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Verificação Não Aprovada</h2>
            <p>Olá, ${verification.vendor.name}!</p>
            <p>Infelizmente, sua solicitação de verificação não foi aprovada.</p>
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>Motivo:</strong>
              <p>${reason}</p>
            </div>
            <p>Você pode corrigir as informações e enviar uma nova solicitação.</p>
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

    res.json({
      success: true,
      message: 'Verificação rejeitada',
      verification
    });
  } catch (error) {
    console.error('Erro ao rejeitar verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao rejeitar verificação'
    });
  }
};

// @desc    Delete verification (Admin)
// @route   DELETE /api/verifications/:id
// @access  Private/Admin
export const deleteVerification = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.vendorVerification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Verificação deletada'
    });
  } catch (error) {
    console.error('Erro ao deletar verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar verificação'
    });
  }
};
