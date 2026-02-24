import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Criando usuário administrador...\n');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@techstore.ao' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true
      },
      create: {
        name: 'Administrador',
        email: 'admin@techstore.ao',
        password: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true
      }
    });
    
    console.log('✅ Admin criado/atualizado com sucesso!\n');
    console.log('📧 Email: admin@techstore.ao');
    console.log('🔑 Senha: admin123');
    console.log('\n💡 Use estas credenciais para fazer login no painel admin');
    console.log('🌐 Acesse: http://localhost:3000/login\n');
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    console.error('\nPossíveis causas:');
    console.error('1. Banco de dados não está rodando');
    console.error('2. Tabelas não foram criadas (execute: npx prisma db push)');
    console.error('3. Erro de conexão com o banco\n');
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
