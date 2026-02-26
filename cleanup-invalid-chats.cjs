const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupInvalidChats() {
  try {
    console.log('🧹 Limpando conversas e mensagens inválidas...\n');

    // Buscar todas as conversas
    const conversations = await prisma.conversation.findMany();
    
    let deletedConversations = 0;
    let deletedMessages = 0;

    for (const conv of conversations) {
      // Verificar se os usuários existem
      const user1Exists = await prisma.user.findUnique({ where: { id: conv.user1Id } });
      const user2Exists = await prisma.user.findUnique({ where: { id: conv.user2Id } });

      if (!user1Exists || !user2Exists) {
        console.log(`❌ Conversa inválida encontrada: ${conv.id}`);
        console.log(`   User1 (${conv.user1Id}): ${user1Exists ? 'OK' : 'NÃO EXISTE'}`);
        console.log(`   User2 (${conv.user2Id}): ${user2Exists ? 'OK' : 'NÃO EXISTE'}`);

        // Deletar mensagens da conversa
        const deletedMsgs = await prisma.message.deleteMany({
          where: { conversationId: conv.id }
        });
        deletedMessages += deletedMsgs.count;

        // Deletar conversa
        await prisma.conversation.delete({
          where: { id: conv.id }
        });
        deletedConversations++;

        console.log(`   ✅ Conversa e ${deletedMsgs.count} mensagens deletadas\n`);
      }
    }

    // Buscar mensagens órfãs (sem conversa válida)
    const messages = await prisma.message.findMany();
    let orphanMessages = 0;

    for (const msg of messages) {
      const conversationExists = await prisma.conversation.findUnique({
        where: { id: msg.conversationId }
      });

      if (!conversationExists) {
        await prisma.message.delete({ where: { id: msg.id } });
        orphanMessages++;
      }
    }

    console.log('\n📊 Resumo da limpeza:');
    console.log(`   Conversas deletadas: ${deletedConversations}`);
    console.log(`   Mensagens deletadas: ${deletedMessages}`);
    console.log(`   Mensagens órfãs deletadas: ${orphanMessages}`);
    console.log('\n✅ Limpeza concluída!');

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupInvalidChats();
