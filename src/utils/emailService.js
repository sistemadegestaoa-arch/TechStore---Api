import nodemailer from 'nodemailer';

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify transporter configuration on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP Configuration Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
    console.log('   Host:', process.env.SMTP_HOST);
    console.log('   Port:', process.env.SMTP_PORT);
    console.log('   User:', process.env.SMTP_USER);
  }
});

// Generic send email function
export const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log('📧 Tentando enviar email...');
    console.log('   Para:', to);
    console.log('   Assunto:', subject);
    console.log('   SMTP Host:', process.env.SMTP_HOST);
    console.log('   SMTP Port:', process.env.SMTP_PORT);
    console.log('   SMTP User:', process.env.SMTP_USER);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'TechStore <noreply@techstore.com>',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email enviado com sucesso!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    return info;
  } catch (error) {
    console.error('❌ ERRO ao enviar email:');
    console.error('   Mensagem:', error.message);
    console.error('   Code:', error.code);
    console.error('   Stack:', error.stack);
    throw error;
  }
};

// Send email verification
export const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verificar-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verificação de Email</title>
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
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #667eea; margin: 0 0 20px 0;">Bem-vindo à TechStore, ${name}!</h2>
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Obrigado por se cadastrar. Por favor, verifique seu email clicando no botão abaixo:
                  </p>
                  
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Seu código de verificação é:</p>
                    <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 2px;">${token}</p>
                  </div>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Verificar Email
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    Ou copie e cole este link no seu navegador:
                  </p>
                  <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0 20px 0;">
                    ${verificationUrl}
                  </p>
                  
                  <p style="color: #999; font-size: 14px; margin: 20px 0 0 0;">
                    ⏰ Este código expira em 24 horas.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
                    Se você não criou esta conta, ignore este email.
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

  return await sendEmail({
    to: email,
    subject: 'Verificação de Email - TechStore',
    html
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/nova-senha?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redefinição de Senha</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔒 Redefinição de Senha</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #667eea; margin: 0 0 20px 0;">Olá ${name},</h2>
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Você solicitou a redefinição de senha. Use o código abaixo:
                  </p>
                  
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Seu código de verificação é:</p>
                    <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 2px;">${token}</p>
                  </div>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Redefinir Senha
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    Ou copie e cole este link no seu navegador:
                  </p>
                  <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0 20px 0;">
                    ${resetUrl}
                  </p>
                  
                  <p style="color: #999; font-size: 14px; margin: 20px 0 0 0;">
                    ⏰ Este código expira em 1 hora.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
                    Se você não solicitou esta redefinição, ignore este email.
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

  return await sendEmail({
    to: email,
    subject: 'Redefinição de Senha - TechStore',
    html
  });
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (email, name, orderNumber, total) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pedido Confirmado</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Pedido Confirmado!</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #667eea; margin: 0 0 20px 0;">Olá ${name},</h2>
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Seu pedido foi confirmado com sucesso! 🎉
                  </p>
                  
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 20px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 10px 0;">
                          <p style="color: #666; margin: 0; font-size: 14px;">Número do Pedido:</p>
                          <p style="color: #333; margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">${orderNumber}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-top: 1px solid #e0e0e0;">
                          <p style="color: #666; margin: 0; font-size: 14px;">Total:</p>
                          <p style="color: #667eea; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'AOA' })}</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                    Você pode acompanhar seu pedido na área "Meus Pedidos".
                  </p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${process.env.FRONTEND_URL}/meus-pedidos" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Ver Meus Pedidos
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                    Obrigado por comprar na TechStore! 💙
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
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

  return await sendEmail({
    to: email,
    subject: `Pedido Confirmado #${orderNumber} - TechStore`,
    html
  });
};

// Send welcome email for newsletter
export const sendNewsletterWelcomeEmail = async (email) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo à Newsletter</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📧 Bem-vindo à Newsletter!</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #667eea; margin: 0 0 20px 0;">Obrigado por se inscrever! 🎉</h2>
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Você receberá as melhores ofertas e novidades em primeira mão!
                  </p>
                  
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 20px 0;">
                    <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px;">O que você vai receber:</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="color: #333; margin: 0; font-size: 15px;">🎁 Ofertas exclusivas para inscritos</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="color: #333; margin: 0; font-size: 15px;">🆕 Novos produtos antes de todo mundo</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="color: #333; margin: 0; font-size: 15px;">💰 Cupons de desconto especiais</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="color: #333; margin: 0; font-size: 15px;">📦 Novidades sobre categorias</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${process.env.FRONTEND_URL}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Visitar TechStore
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
                    Você está recebendo este email porque se inscreveu na newsletter da TechStore.
                  </p>
                  <p style="color: #999; font-size: 12px; margin: 10px 0 0 0; text-align: center;">
                    Para cancelar a inscrição, <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe?email=${email}" style="color: #667eea; text-decoration: none;">clique aqui</a>.
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

  return await sendEmail({
    to: email,
    subject: 'Bem-vindo à Newsletter da TechStore!',
    html
  });
};
