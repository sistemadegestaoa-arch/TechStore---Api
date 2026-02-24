import dotenv from 'dotenv';
import { sendEmail } from './src/utils/emailService.js';

// Load environment variables
dotenv.config();

console.log('🧪 Testando configuração de email...\n');

console.log('📋 Configurações:');
console.log('   SMTP_HOST:', process.env.SMTP_HOST);
console.log('   SMTP_PORT:', process.env.SMTP_PORT);
console.log('   SMTP_USER:', process.env.SMTP_USER);
console.log('   SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NÃO CONFIGURADO');
console.log('   EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('');

// Test email
const testEmail = async () => {
  try {
    console.log('📤 Enviando email de teste...\n');
    
    await sendEmail({
      to: process.env.SMTP_USER, // Send to yourself
      subject: '🧪 Teste de Email - TechStore',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Teste de Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #667eea;">✅ Email Funcionando!</h1>
          <p>Se você está vendo esta mensagem, a configuração de email está funcionando corretamente.</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">TechStore - Sistema de Email</p>
        </body>
        </html>
      `
    });

    console.log('\n✅ Teste concluído com sucesso!');
    console.log('📧 Verifique sua caixa de entrada:', process.env.SMTP_USER);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Teste falhou!');
    console.error('Erro:', error.message);
    process.exit(1);
  }
};

// Wait for transporter verification before testing
setTimeout(testEmail, 2000);
