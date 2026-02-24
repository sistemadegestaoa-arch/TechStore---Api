import prisma from '../config/prisma.js';
import { sendEmail } from '../utils/emailService.js';

// @desc    Create contact message
// @route   POST /api/contacts
// @access  Public
export const createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    console.log('📧 Nova mensagem de contato recebida:', { name, email, subject });

    // Validação
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validar mensagem mínima
    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A mensagem deve ter no mínimo 10 caracteres'
      });
    }

    // Salvar no banco de dados
    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
        status: 'PENDING'
      }
    });

    console.log('✅ Mensagem salva no banco:', contact.id);

    // Enviar email de notificação para o admin
    try {
      await sendEmail({
        to: process.env.SMTP_USER, // Email do admin
        subject: `Nova Mensagem de Contato: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">Nova Mensagem de Contato</h2>
            <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Nome:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
              <p><strong>Assunto:</strong> ${subject}</p>
              <p><strong>Mensagem:</strong></p>
              <p style="background: white; padding: 15px; border-radius: 5px;">${message}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              Mensagem recebida em ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        `
      });
      console.log('✅ Email de notificação enviado para o admin');
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de notificação:', emailError);
      // Não falhar a requisição se o email falhar
    }

    // Enviar email de confirmação para o cliente
    try {
      await sendEmail({
        to: email,
        subject: 'Recebemos sua mensagem - TechStore',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">Olá, ${name}!</h2>
            <p>Recebemos sua mensagem e entraremos em contato em breve.</p>
            <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Assunto:</strong> ${subject}</p>
              <p><strong>Sua mensagem:</strong></p>
              <p style="background: white; padding: 15px; border-radius: 5px;">${message}</p>
            </div>
            <p>Nossa equipe responderá em até 24 horas úteis.</p>
            <p style="color: #666; font-size: 14px;">
              Atenciosamente,<br>
              Equipe TechStore
            </p>
          </div>
        `
      });
      console.log('✅ Email de confirmação enviado para o cliente');
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de confirmação:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Erro ao criar mensagem de contato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem. Tente novamente mais tarde.',
      error: error.message
    });
  }
};

// @desc    Get all contacts (Admin)
// @route   GET /api/contacts
// @access  Private/Admin
export const getAllContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    const contacts = await prisma.contact.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.contact.count({ where });

    res.json({
      success: true,
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contatos'
    });
  }
};

// @desc    Update contact status (Admin)
// @route   PATCH /api/contacts/:id
// @access  Private/Admin
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'READ', 'REPLIED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido'
      });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      contact
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status'
    });
  }
};

// @desc    Delete contact (Admin)
// @route   DELETE /api/contacts/:id
// @access  Private/Admin
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.contact.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Mensagem deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar contato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar mensagem'
    });
  }
};
