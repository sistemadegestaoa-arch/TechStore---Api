# Guia de Correção do Erro de Chat

## Problema
Erro ao enviar mensagens no chat: `Foreign key constraint violated: conversations_user2Id_fkey`

## Causa
Este erro ocorre quando:
1. Uma conversa tenta referenciar um usuário que não existe no banco de dados
2. Dados de conversas antigas com referências inválidas

## Solução Implementada

### 1. Validação no Backend
Adicionada validação para verificar se o destinatário existe antes de criar a conversa:

```javascript
// Validate receiver exists
const receiver = await prisma.user.findUnique({
  where: { id: receiverId }
});

if (!receiver) {
  return res.status(404).json({
    success: false,
    message: 'Destinatário não encontrado'
  });
}
```

### 2. Melhor Tratamento de Erros no Frontend
Adicionada validação e logs para identificar problemas:

```javascript
if (!selectedConversation.otherUser?.id) {
  showToast('Erro: Destinatário inválido', 'error');
  return;
}
```

### 3. Campos Adicionais na API
Adicionados campos `role` e `phone` nas conversas para melhor funcionalidade.

## Como Corrigir o Banco de Dados

### Passo 1: Verificar Dados
Execute o script de teste para ver se há dados inválidos:

```bash
cd backend
node test-chat-data.js
```

### Passo 2: Limpar Dados Inválidos
Se encontrar conversas ou mensagens inválidas, execute:

```bash
node cleanup-invalid-chats.js
```

Este script irá:
- Deletar conversas que referenciam usuários inexistentes
- Deletar mensagens órfãs (sem conversa válida)
- Mostrar um resumo das operações

### Passo 3: Reiniciar o Servidor
Após a limpeza, reinicie o servidor:

```bash
npm run dev
```

## Testando o Chat

1. Faça login com dois usuários diferentes
2. Tente iniciar uma conversa
3. Envie mensagens
4. Verifique se não há erros no console

## Logs de Debug

Os seguintes logs foram adicionados para facilitar o debug:

**Backend:**
- `📨 Enviando mensagem:` - Mostra dados da mensagem
- `❌ Destinatário não encontrado:` - Quando o usuário não existe
- `✅ Destinatário encontrado:` - Quando validação passa

**Frontend:**
- `📤 Enviando mensagem para:` - Mostra dados do destinatário
- `❌ otherUser.id não encontrado:` - Quando há problema com a conversa

## Prevenção

Para evitar este erro no futuro:
1. Sempre valide IDs de usuários antes de criar conversas
2. Use `onDelete: Cascade` nas relações do Prisma (já implementado)
3. Monitore os logs do servidor para identificar problemas rapidamente

## Suporte

Se o erro persistir:
1. Verifique os logs do servidor
2. Execute o script de teste
3. Verifique se todos os usuários existem no banco de dados
4. Considere resetar o banco de dados de desenvolvimento se necessário
