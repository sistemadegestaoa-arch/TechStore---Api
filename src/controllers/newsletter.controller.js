import prisma from '../config/prisma.js';
import { sendEmail, sendNewsletterWelcomeEmail } from '../utils/emailService.js';

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
export const subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    // Check if already subscribed
    const existing = await prisma.newsletter.findUnique({
      where: { email }
    });

    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ message: 'Este email já está inscrito' });
      } else {
        // Reactivate subscription
        await prisma.newsletter.update({
          where: { email },
          data: { isActive: true }
        });
        return res.json({ message: 'Inscrição reativada com sucesso!' });
      }
    }

    // Create new subscription
    await prisma.newsletter.create({
      data: { email }
    });

    // Send welcome email
    try {
      await sendNewsletterWelcomeEmail(email);
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
    }

    res.status(201).json({ message: 'Inscrição realizada com sucesso!' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Erro ao realizar inscrição' });
  }
};

// @desc    Unsubscribe from newsletter
// @route   POST /api/newsletter/unsubscribe
// @access  Public
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    await prisma.newsletter.update({
      where: { email },
      data: { isActive: false }
    });

    res.json({ message: 'Inscrição cancelada com sucesso' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ message: 'Erro ao cancelar inscrição' });
  }
};

// @desc    Get all subscribers (Admin)
// @route   GET /api/newsletter/subscribers
// @access  Private/Admin
export const getSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 50, isActive } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [subscribers, total] = await Promise.all([
      prisma.newsletter.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.newsletter.count({ where })
    ]);

    res.json({
      subscribers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ message: 'Erro ao buscar inscritos' });
  }
};

// @desc    Send email to all subscribers
// @route   POST /api/newsletter/send
// @access  Private/Admin
export const sendNewsletter = async (req, res) => {
  try {
    const { subject, html } = req.body;

    const subscribers = await prisma.newsletter.findMany({
      where: { isActive: true }
    });

    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      try {
        await sendEmail({
          to: subscriber.email,
          subject,
          html
        });
        sent++;
      } catch (error) {
        console.error(`Erro ao enviar para ${subscriber.email}:`, error);
        failed++;
      }
    }

    res.json({
      message: 'Newsletter enviada',
      sent,
      failed,
      total: subscribers.length
    });
  } catch (error) {
    console.error('Send newsletter error:', error);
    res.status(500).json({ message: 'Erro ao enviar newsletter' });
  }
};

// @desc    Notify subscribers about new product
// @route   POST /api/newsletter/notify-product
// @access  Private (called internally)
export const notifyNewProduct = async (product) => {
  try {
    console.log('🔔 Iniciando notificação de novo produto:', product.name);
    
    const subscribers = await prisma.newsletter.findMany({
      where: { isActive: true }
    });

    console.log(`📊 Total de inscritos ativos: ${subscribers.length}`);

    if (subscribers.length === 0) {
      console.log('⚠️ Nenhum inscrito na newsletter');
      return;
    }

    const subject = `🎉 Novo Produto na TechStore: ${product.name}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Novo Produto Disponível</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🛍️ TechStore</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Novo Produto Disponível!</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #667eea; margin: 0 0 20px 0; font-size: 24px;">🎉 ${product.name}</h2>
                    
                    ${product.images && product.images.length > 0 ? `
                    <div style="text-align: center; margin: 20px 0;">
                      <img src="${product.images[0]}" alt="${product.name}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e0e0e0;" />
                    </div>
                    ` : ''}
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                      ${product.description}
                    </p>
                    
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 10px 0;">
                            <p style="color: #666; margin: 0; font-size: 14px;">Preço:</p>
                            <p style="color: #667eea; margin: 5px 0 0 0; font-size: 28px; font-weight: bold;">
                              ${Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'AOA' })}
                            </p>
                          </td>
                        </tr>
                        ${product.comparePrice ? `
                        <tr>
                          <td style="padding: 10px 0;">
                            <p style="color: #999; margin: 0; font-size: 14px; text-decoration: line-through;">
                              De: ${Number(product.comparePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'AOA' })}
                            </p>
                          </td>
                        </tr>
                        ` : ''}
                      </table>
                    </div>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${process.env.FRONTEND_URL}/produto/${product.id}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            🛒 Ver Produto e Comprar Agora
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                      ⚡ Seja o primeiro a comprar! Estoque limitado.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                    <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
                      Você está recebendo este email porque se inscreveu na newsletter da TechStore.
                    </p>
                    <p style="color: #999; font-size: 12px; margin: 10px 0 0 0; text-align: center;">
                      Para cancelar a inscrição, <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe" style="color: #667eea; text-decoration: none;">clique aqui</a>.
                    </p>
                    <p style="color: #999; font-size: 12px; margin: 10px 0 0 0; text-align: center;">
                      © ${new Date().getFullYear()} TechStore. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    let sent = 0;
    let failed = 0;

    console.log('📤 Enviando emails para inscritos...');
    
    for (const subscriber of subscribers) {
      try {
        await sendEmail({
          to: subscriber.email,
          subject,
          html
        });
        sent++;
        console.log(`   ✅ Enviado para: ${subscriber.email}`);
      } catch (error) {
        console.error(`   ❌ Erro ao notificar ${subscriber.email}:`, error.message);
        failed++;
      }
    }

    console.log(`\n✅ Notificação de novo produto concluída:`);
    console.log(`   📧 Enviados: ${sent}`);
    console.log(`   ❌ Falharam: ${failed}`);
    console.log(`   📊 Total: ${subscribers.length}`);
  } catch (error) {
    console.error('❌ Notify new product error:', error);
  }
};

// @desc    Notify vendors about new category
// @route   POST /api/newsletter/notify-category
// @access  Private (called internally)
export const notifyNewCategory = async (category) => {
  try {
    console.log('🔔 Iniciando notificação de nova categoria:', category.name);
    
    const vendors = await prisma.user.findMany({
      where: { role: 'VENDOR', isActive: true },
      select: { email: true, name: true }
    });

    console.log(`📊 Total de vendedores ativos: ${vendors.length}`);

    if (vendors.length === 0) {
      console.log('⚠️ Nenhum vendedor ativo encontrado');
      return;
    }

    const subject = `🎯 Nova Categoria na TechStore: ${category.name}`;
    
    let sent = 0;
    let failed = 0;

    console.log('📤 Enviando emails para vendedores...');
    
    for (const vendor of vendors) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nova Categoria Disponível</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🛍️ TechStore</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Nova Categoria Disponível!</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #667eea; margin: 0 0 20px 0; font-size: 24px;">Olá ${vendor.name}! 👋</h2>
                      
                      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Temos uma ótima notícia! A TechStore acaba de adicionar uma nova categoria:
                      </p>
                      
                      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                        <div style="font-size: 60px; margin-bottom: 15px;">${category.icon || '📦'}</div>
                        <h3 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${category.name}</h3>
                      </div>
                      
                      ${category.description ? `
                      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                        ${category.description}
                      </p>
                      ` : ''}
                      
                      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
                        <h4 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px;">💡 Oportunidade para Você:</h4>
                        <ul style="color: #333; line-height: 1.8; margin: 0; padding-left: 20px;">
                          <li>Cadastre seus produtos nesta nova categoria</li>
                          <li>Alcance mais clientes interessados</li>
                          <li>Aumente suas vendas com produtos relevantes</li>
                          <li>Seja um dos primeiros a oferecer produtos nesta categoria</li>
                        </ul>
                      </div>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${process.env.FRONTEND_URL}/adicionar-produto" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                              ➕ Cadastrar Produto Agora
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                        ⚡ Não perca tempo! Seja o primeiro a cadastrar produtos nesta categoria.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                      <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
                        Você está recebendo este email porque é um vendedor cadastrado na TechStore.
                      </p>
                      <p style="color: #999; font-size: 12px; margin: 10px 0 0 0; text-align: center;">
                        Dúvidas? Entre em contato: <a href="mailto:lojadevenda@gmail.com" style="color: #667eea; text-decoration: none;">lojadevenda@gmail.com</a>
                      </p>
                      <p style="color: #999; font-size: 12px; margin: 10px 0 0 0; text-align: center;">
                        © ${new Date().getFullYear()} TechStore. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      try {
        await sendEmail({
          to: vendor.email,
          subject,
          html
        });
        sent++;
        console.log(`   ✅ Enviado para: ${vendor.email}`);
      } catch (error) {
        console.error(`   ❌ Erro ao notificar ${vendor.email}:`, error.message);
        failed++;
      }
    }

    console.log(`\n✅ Notificação de nova categoria concluída:`);
    console.log(`   📧 Enviados: ${sent}`);
    console.log(`   ❌ Falharam: ${failed}`);
    console.log(`   📊 Total: ${vendors.length}`);
  } catch (error) {
    console.error('❌ Notify new category error:', error);
  }
};
