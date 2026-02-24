import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar categorias
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'eletronicos' },
      update: {},
      create: {
        name: 'Eletrônicos',
        slug: 'eletronicos',
        description: 'Produtos eletrônicos e tecnologia',
        icon: '💻',
        isActive: true
      }
    }),
    prisma.category.upsert({
      where: { slug: 'moveis' },
      update: {},
      create: {
        name: 'Móveis',
        slug: 'moveis',
        description: 'Móveis e decoração',
        icon: '🪑',
        isActive: true
      }
    }),
    prisma.category.upsert({
      where: { slug: 'acessorios' },
      update: {},
      create: {
        name: 'Acessórios',
        slug: 'acessorios',
        description: 'Acessórios diversos',
        icon: '📦',
        isActive: true
      }
    }),
    prisma.category.upsert({
      where: { slug: 'games' },
      update: {},
      create: {
        name: 'Games',
        slug: 'games',
        description: 'Jogos e consoles',
        icon: '🎮',
        isActive: true
      }
    }),
    prisma.category.upsert({
      where: { slug: 'celulares' },
      update: {},
      create: {
        name: 'Celulares',
        slug: 'celulares',
        description: 'Smartphones e tablets',
        icon: '📱',
        isActive: true
      }
    }),
    prisma.category.upsert({
      where: { slug: 'smartwatch' },
      update: {},
      create: {
        name: 'Smartwatch',
        slug: 'smartwatch',
        description: 'Relógios inteligentes',
        icon: '⌚',
        isActive: true
      }
    }),
    prisma.category.upsert({
      where: { slug: 'computadores' },
      update: {},
      create: {
        name: 'Computadores',
        slug: 'computadores',
        description: 'Desktops e notebooks',
        icon: '🖥️',
        isActive: true
      }
    }),
    prisma.category.upsert({
      where: { slug: 'audio' },
      update: {},
      create: {
        name: 'Áudio',
        slug: 'audio',
        description: 'Fones, caixas de som e equipamentos de áudio',
        icon: '🎧',
        isActive: true
      }
    }),
    prisma.category.upsert({
      where: { slug: 'casa-jardim' },
      update: {},
      create: {
        name: 'Casa e Jardim',
        slug: 'casa-jardim',
        description: 'Produtos para casa e jardim',
        icon: '🏡',
        isActive: true
      }
    }),
    prisma.category.upsert({
      where: { slug: 'esportes' },
      update: {},
      create: {
        name: 'Esportes',
        slug: 'esportes',
        description: 'Artigos esportivos',
        icon: '⚽',
        isActive: true
      }
    })
  ]);

  console.log('✅ Categorias criadas');

  // Criar usuário admin
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@techstore.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@techstore.com',
      password: hashedPassword,
      phone: '+244940379298',
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true
    }
  });

  console.log('✅ Usuário admin criado');

  // Criar vendedor de exemplo
  const vendorPassword = await bcrypt.hash('vendor123', salt);
  const vendor = await prisma.user.upsert({
    where: { email: 'vendedor@techstore.com' },
    update: {},
    create: {
      name: 'João Silva',
      email: 'vendedor@techstore.com',
      password: vendorPassword,
      phone: '+244923456789',
      role: 'VENDOR',
      isEmailVerified: true,
      isActive: true,
      storeName: 'TechStore Premium',
      storeDescription: 'Loja especializada em produtos de tecnologia de alta qualidade',
      address: 'Rua Principal, 123',
      city: 'Luanda',
      province: 'Luanda',
      country: 'Angola',
      commissionRate: 8.00
    }
  });

  console.log('✅ Vendedor de exemplo criado');

  // Criar cliente de exemplo
  const customerPassword = await bcrypt.hash('customer123', salt);
  const customer = await prisma.user.upsert({
    where: { email: 'cliente@techstore.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'cliente@techstore.com',
      password: customerPassword,
      phone: '+244912345678',
      role: 'CUSTOMER',
      isEmailVerified: true,
      isActive: true,
      address: 'Avenida Central, 456',
      city: 'Luanda',
      province: 'Luanda',
      country: 'Angola'
    }
  });

  console.log('✅ Cliente de exemplo criado');

  // Criar produtos de exemplo
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'notebook-dell-inspiron' },
      update: {},
      create: {
        name: 'Notebook Dell Inspiron',
        slug: 'notebook-dell-inspiron',
        description: 'Notebook Dell Inspiron com processador Intel Core i7, 16GB RAM, SSD 512GB. Ideal para trabalho e entretenimento.',
        price: 3500,
        comparePrice: 4000,
        sku: 'DELL-NB-001',
        stock: 15,
        brand: 'Dell',
        condition: 'NEW',
        status: 'ACTIVE',
        images: ['💻'],
        specifications: {
          processor: 'Intel Core i7',
          ram: '16GB',
          storage: '512GB SSD',
          screen: '15.6 polegadas'
        },
        isFeatured: true,
        vendorId: vendor.id,
        categoryId: categories[0].id
      }
    }),
    prisma.product.upsert({
      where: { slug: 'mouse-gamer-rgb' },
      update: {},
      create: {
        name: 'Mouse Gamer RGB',
        slug: 'mouse-gamer-rgb',
        description: 'Mouse gamer com iluminação RGB, 7 botões programáveis e sensor óptico de alta precisão.',
        price: 150,
        comparePrice: 200,
        sku: 'MOUSE-RGB-001',
        stock: 50,
        brand: 'Logitech',
        condition: 'NEW',
        status: 'ACTIVE',
        images: ['🖱️'],
        specifications: {
          dpi: '16000',
          buttons: '7',
          rgb: 'Sim'
        },
        vendorId: vendor.id,
        categoryId: categories[2].id
      }
    }),
    prisma.product.upsert({
      where: { slug: 'cadeira-gamer-pro' },
      update: {},
      create: {
        name: 'Cadeira Gamer Pro',
        slug: 'cadeira-gamer-pro',
        description: 'Cadeira gamer ergonômica com ajuste de altura, apoio lombar e reclinável até 180°.',
        price: 1200,
        comparePrice: 1500,
        sku: 'CHAIR-GAMER-001',
        stock: 10,
        brand: 'DXRacer',
        condition: 'NEW',
        status: 'ACTIVE',
        images: ['🪑'],
        specifications: {
          material: 'Couro sintético',
          peso_max: '120kg',
          reclinavel: 'Até 180°'
        },
        isFeatured: true,
        vendorId: vendor.id,
        categoryId: categories[1].id
      }
    })
  ]);

  console.log('✅ Produtos de exemplo criados');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📝 Credenciais de acesso:');
  console.log('Admin: admin@techstore.com / admin123');
  console.log('Vendedor: vendedor@techstore.com / vendor123');
  console.log('Cliente: cliente@techstore.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
