# 🔧 Correção Rápida do Erro de Chat

## ❌ Erro
```
Foreign key constraint violated: conversations_user2Id_fkey (index)
```

## 🎯 Causa
Tentativa de criar conversa com um usuário que não existe no banco de dados.

## ✅ Solução Rápida

### Opção 1: Usando SQL (Mais Rápido)

1. **Conecte ao banco de dados:**
   ```bash
   # Windows (PowerShell)
   psql -U postgres -d techstore
   
   # Ou se tiver outro usuário
   psql -U seu_usuario -d techstore
   ```

2. **Execute as queries de verificação:**
   ```sql
   -- Ver conversas com problemas
   SELECT 
       c.id, c."user1Id", c."user2Id",
       u1.name as user1_name, u2.name as user2_name
   FROM conversations c
   LEFT JOIN users u1 ON c."user1Id" = u1.id
   LEFT JOIN users u2 ON c."user2Id" = u2.id
   WHERE u1.id IS NULL OR u2.id IS NULL;
   ```

3. **Se encontrar conversas inválidas, delete:**
   ```sql
   -- Deletar mensagens das conversas inválidas
   DELETE FROM messages 
   WHERE "conversationId" IN (
       SELECT c.id FROM conversations c
       LEFT JOIN users u1 ON c."user1Id" = u1.id
       LEFT JOIN users u2 ON c."user2Id" = u2.id
       WHERE u1.id IS NULL OR u2.id IS NULL
   );
   
   -- Deletar conversas inválidas
   DELETE FROM conversations
   WHERE id IN (
       SELECT c.id FROM conversations c
       LEFT JOIN users u1 ON c."user1Id" = u1.id
       LEFT JOIN users u2 ON c."user2Id" = u2.id
       WHERE u1.id IS NULL OR u2.id IS NULL
   );
   ```

4. **Verificar usuários disponíveis:**
   ```sql
   SELECT id, name, email, role FROM users;
   ```

### Opção 2: Resetar Apenas o Chat

Se quiser limpar todo o histórico de chat:

```sql
-- Conecte ao banco
psql -U postgres -d techstore

-- Delete tudo do chat
DELETE FROM messages;
DELETE FROM conversations;

-- Verifique
SELECT COUNT(*) FROM messages;
SELECT COUNT(*) FROM conversations;
```

### Opção 3: Resetar Banco Completo (CUIDADO!)

⚠️ **Isso vai apagar TODOS os dados!**

```bash
cd backend
npx prisma migrate reset
npx prisma db seed
```

## 🧪 Testar Após Correção

1. **Reinicie o backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Teste o chat:**
   - Faça login com dois usuários diferentes
   - Acesse /chat
   - Tente enviar uma mensagem
   - Verifique se não há erros no console

## 📊 Verificar Logs

O backend agora tem logs detalhados:

```
📨 Enviando mensagem: { senderId, receiverId, ... }
✅ Destinatário encontrado: Nome do Usuário
❌ Destinatário não encontrado: [id]
```

Monitore o terminal do backend ao enviar mensagens.

## 🔍 Identificar o Problema

Se o erro persistir, verifique:

1. **No console do navegador (F12):**
   ```javascript
   // Procure por:
   📤 Enviando mensagem para: { id, name, ... }
   ```

2. **No terminal do backend:**
   ```
   📨 Enviando mensagem: { senderId: "...", receiverId: "..." }
   ```

3. **Compare os IDs:**
   - O `receiverId` existe na tabela `users`?
   - Execute: `SELECT id, name FROM users WHERE id = 'receiverId_aqui';`

## 💡 Prevenção

As correções implementadas previnem este erro:

1. ✅ Validação de destinatário antes de criar conversa
2. ✅ Mensagem de erro clara
3. ✅ Logs detalhados
4. ✅ Validação no frontend

## 🆘 Ainda com Problemas?

1. Verifique se o backend está atualizado com as correções
2. Limpe o cache do navegador (Ctrl + Shift + Delete)
3. Limpe o localStorage:
   ```javascript
   // No console do navegador
   localStorage.clear();
   location.reload();
   ```

4. Verifique se há múltiplas instâncias do backend rodando:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   ```

## 📝 Comandos Úteis

```bash
# Ver logs do backend em tempo real
cd backend
npm run dev

# Conectar ao banco
psql -U postgres -d techstore

# Ver todas as tabelas
\dt

# Ver estrutura de uma tabela
\d conversations
\d messages
\d users

# Sair do psql
\q
```

## ✅ Checklist de Correção

- [ ] Backend atualizado com validações
- [ ] Banco de dados limpo (sem conversas inválidas)
- [ ] Backend reiniciado
- [ ] Frontend recarregado (Ctrl + F5)
- [ ] Teste com dois usuários diferentes
- [ ] Logs monitorados
- [ ] Sem erros no console

Pronto! O chat deve funcionar agora. 🎉
