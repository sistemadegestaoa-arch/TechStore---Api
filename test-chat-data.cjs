const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testChatData() {
  try {
    console.log('🔍 Verificando dados do chat...\n');

    // Verificar conversas
    const conversations = await prisma.conversation.findMany({
      include: {
        user1: { select: { id: true, name: true, email: true } },
        user2: { select: { id: true, name: true, email: true } }
      }
    });

    console.log(`📊 Total de conversas: ${conversations.length}\n`);

    if (conversations.length > 0) {
      console.log('Conversas encontradas:');
      conversations.forEach((conv, index) => {
        console.log(`\n${index + 1}. Conversa ID: ${conv.id}`);
        console.log(`   User1: ${conv.user1?.name || 'USUÁRIO NÃO ENCONTRADO'} (${conv.user1Id})`);
        console.log(`   User2: ${conv.user2?.name || 'USUÁRIO NÃO ENCONTRADO'} (${conv.user2Id})`);
        console.log(`   Última mensagem: ${conv.lastMessageAt}`);
      });
    }

    // Verificar mensagens
    const messages = await prisma.message.findMany({
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n\n📨 Total de mensagens: ${messages.length}\n`);

    if (messages.length > 0) {
      console.log('Últimas mensagens:');
      messages.forEach((msg, index) => {
        console.log(`\n${index + 1}. Mensagem ID: ${msg.id}`);
        console.log(`   De: ${msg.sender?.name || 'USUÁRIO NÃO ENCONTRADO'} (${msg.senderId})`);
        console.log(`   Para: ${msg.receiver?.name || 'USUÁRIO NÃO ENCONTRADO'} (${msg.receiverId})`);
        console.log(`   Mensagem: ${msg.message.substring(0, 50)}...`);
      });
    }

    // Verificar usuários
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });

    console.log(`\n\n👥 Total de usuários: ${users.length}\n`);
    console.log('Usuários disponíveis:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} - ID: ${user.id}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testChatData();
