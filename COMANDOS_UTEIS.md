# 🛠️ Comandos Úteis - Sistema de Notificações

## 🚀 Setup Inicial

### 1. Rodar Migration
```bash
cd backend
npx prisma migrate dev --name add_all_features
npx prisma generate
```

### 2. Iniciar Servidor
```bash
npm run dev
```

### 3. Verificar Tabelas Criadas
```bash
npx prisma studio
```
Abre interface visual do banco de dados em `http://localhost:5555`

---

## 🗄️ Consultas SQL Úteis

### Ver todas as notificações
```sql
SELECT * FROM "Notification" ORDER BY "createdAt" DESC LIMIT 20;
```

### Ver notificações de um usuário específico
```sql
SELECT * FROM "Notification" 
WHERE "userId" = 'USER_ID_AQUI' 
ORDER BY "createdAt" DESC;
```

### Contar notificações não lidas por usuário
```sql
SELECT "userId", COUNT(*) as unread_count 
FROM "Notification" 
WHERE "isRead" = false 
GROUP BY "userId";
```

### Ver notificações por tipo
```sql
SELECT "type", COUNT(*) as count 
FROM "Notification" 
GROUP BY "type" 
ORDER BY count DESC;
```

### Ver últimas notificações criadas (últimos 5 minutos)
```sql
SELECT * FROM "Notification" 
WHERE "createdAt" > NOW() - INTERVAL '5 minutes' 
ORDER BY "createdAt" DESC;
```

### Marcar todas como lidas para um usuário
```sql
UPDATE "Notification" 
SET "isRead" = true 
WHERE "userId" = 'USER_ID_AQUI' AND "isRead" = false;
```

### Deletar notificações antigas (mais de 30 dias)
```sql
DELETE FROM "Notification" 
WHERE "createdAt" < NOW() - INTERVAL '30 days';
```

### Ver estatísticas gerais
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN "isRead" = true THEN 1 END) as read,
  COUNT(CASE WHEN "isRead" = false THEN 1 END) as unread,
  COUNT(DISTINCT "userId") as unique_users
FROM "Notification";
```

---

## 🧪 Testes com cURL

### 1. Criar Usuário (recebe notificação de boas-vindas)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "phone": "+244 923 456 789"
  }'
```

### 2. Buscar Notificações
```bash
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 3. Marcar Notificação como Lida
```bash
curl -X PATCH http://localhost:5000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 4. Marcar Todas como Lidas
```bash
curl -X PATCH http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 5. Deletar Notificação
```bash
curl -X DELETE http://localhost:5000/api/notifications/NOTIFICATION_ID \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 6. Criar Pedido (gera múltiplas notificações)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "PRODUCT_ID",
        "quantity": 2
      }
    ],
    "shippingAddress": "Rua ABC, 123",
    "shippingCity": "Luanda",
    "shippingProvince": "Luanda",
    "shippingPostalCode": "1000",
    "shippingPhone": "+244 923 456 789",
    "paymentMethod": "CASH_ON_DELIVERY"
  }'
```

### 7. Atualizar Status do Pedido
```bash
curl -X PATCH http://localhost:5000/api/orders/ORDER_ID/status \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SHIPPING",
    "trackingNumber": "TRACK123"
  }'
```

### 8. Enviar Mensagem no Chat
```bash
curl -X POST http://localhost:5000/api/chat/messages \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "RECEIVER_USER_ID",
    "message": "Olá! Tenho interesse no produto."
  }'
```

---

## 🔍 Debug e Logs

### Ver logs do servidor em tempo real
```bash
npm run dev | grep "Notificação"
```

### Ver apenas erros de notificação
```bash
npm run dev | grep "❌.*notificação"
```

### Ver notificações criadas com sucesso
```bash
npm run dev | grep "✅ Notificação criada"
```

### Logs detalhados do Prisma
```bash
# Adicione ao .env
DEBUG=prisma:query
```

---

## 🧹 Limpeza e Manutenção

### Resetar banco de dados (CUIDADO: apaga tudo)
```bash
npx prisma migrate reset
```

### Limpar notificações antigas (via script)
```javascript
// scripts/clean-old-notifications.js
import prisma from '../src/config/prisma.js';

const cleanOldNotifications = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo
      }
    }
  });

  console.log(`🗑️ ${result.count} notificações antigas deletadas`);
};

cleanOldNotifications();
```

Executar:
```bash
node scripts/clean-old-notifications.js
```

---

## 📊 Monitoramento

### Ver quantidade de notificações por hora (PostgreSQL)
```sql
SELECT 
  DATE_TRUNC('hour', "createdAt") as hour,
  COUNT(*) as count
FROM "Notification"
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### Ver usuários mais ativos (mais notificações)
```sql
SELECT 
  u.name,
  u.email,
  COUNT(n.id) as notification_count
FROM "User" u
LEFT JOIN "Notification" n ON u.id = n."userId"
GROUP BY u.id, u.name, u.email
ORDER BY notification_count DESC
LIMIT 10;
```

### Taxa de leitura de notificações
```sql
SELECT 
  ROUND(
    (COUNT(CASE WHEN "isRead" = true THEN 1 END)::float / COUNT(*)::float) * 100,
    2
  ) as read_percentage
FROM "Notification";
```

---

## 🔧 Troubleshooting

### Problema: Notificações não aparecem

**1. Verificar se migration rodou:**
```bash
npx prisma migrate status
```

**2. Verificar se tabela existe:**
```sql
SELECT * FROM "Notification" LIMIT 1;
```

**3. Verificar logs do backend:**
```bash
npm run dev | grep -i "notification\|notificação"
```

**4. Verificar se usuário está autenticado:**
```bash
# No frontend, console do navegador:
console.log(localStorage.getItem('token'));
```

---

### Problema: Erro ao criar notificação

**1. Verificar se userId existe:**
```sql
SELECT id, name, email FROM "User" WHERE id = 'USER_ID_AQUI';
```

**2. Verificar campos obrigatórios:**
```javascript
// Todos esses campos são obrigatórios:
{
  userId: string,
  type: 'ORDER' | 'PRODUCT' | 'PROMOTION' | 'SYSTEM',
  title: string,
  message: string,
  link: string | null
}
```

**3. Verificar conexão com banco:**
```bash
npx prisma db pull
```

---

### Problema: Frontend não atualiza

**1. Verificar se auto-refresh está funcionando:**
```javascript
// No console do navegador:
// Deve mostrar requisição a cada 30s
```

**2. Forçar atualização manual:**
```javascript
// No console do navegador:
window.location.reload();
```

**3. Limpar cache:**
```bash
# Chrome/Edge: Ctrl + Shift + Delete
# Firefox: Ctrl + Shift + Del
```

---

## 🎯 Scripts Úteis

### Criar notificação de teste
```javascript
// scripts/create-test-notification.js
import prisma from '../src/config/prisma.js';

const createTestNotification = async (userId) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: 'SYSTEM',
      title: '🧪 Notificação de Teste',
      message: 'Esta é uma notificação de teste criada manualmente',
      link: '/produtos'
    }
  });

  console.log('✅ Notificação de teste criada:', notification);
};

// Substitua pelo ID do usuário
createTestNotification('USER_ID_AQUI');
```

Executar:
```bash
node scripts/create-test-notification.js
```

---

### Enviar notificação para todos os usuários
```javascript
// scripts/notify-all-users.js
import prisma from '../src/config/prisma.js';

const notifyAllUsers = async () => {
  const users = await prisma.user.findMany({
    where: { isActive: true }
  });

  for (const user of users) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'PROMOTION',
        title: '🎉 Promoção Especial!',
        message: 'Aproveite 20% de desconto em todos os produtos!',
        link: '/produtos'
      }
    });
  }

  console.log(`✅ ${users.length} notificações enviadas`);
};

notifyAllUsers();
```

---

## 📱 Testes Mobile

### Testar responsividade
```bash
# Chrome DevTools: F12 → Toggle Device Toolbar (Ctrl+Shift+M)
# Testar em:
# - iPhone SE (375x667)
# - iPhone 12 Pro (390x844)
# - iPad (768x1024)
# - Samsung Galaxy S20 (360x800)
```

### Verificar font-size em inputs
```javascript
// Deve ser >= 16px para evitar zoom no iOS
// Verificar em: frontend/src/components/NotificationBell.jsx
```

---

## 🚀 Deploy

### Antes de fazer deploy:

1. ✅ Rodar migration em produção
```bash
npx prisma migrate deploy
```

2. ✅ Gerar cliente Prisma
```bash
npx prisma generate
```

3. ✅ Verificar variáveis de ambiente
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=https://...
```

4. ✅ Testar em staging primeiro
```bash
npm run test
```

---

## 📚 Documentação Relacionada

- `NOTIFICACOES_INTEGRADAS.md` - Detalhes técnicos da implementação
- `TESTE_NOTIFICACOES.md` - Guia completo de testes
- `FLUXO_NOTIFICACOES.md` - Fluxogramas e diagramas
- `backend/src/utils/notificationHelper.js` - Código fonte do helper

---

## 💡 Dicas

1. **Use Prisma Studio** para visualizar dados: `npx prisma studio`
2. **Logs são seus amigos**: Sempre verifique os logs do backend
3. **Teste em incógnito**: Para evitar problemas de cache
4. **Use Postman/Insomnia**: Para testar APIs facilmente
5. **Backup antes de resetar**: `pg_dump` antes de `migrate reset`

---

**Última Atualização**: 25 de Fevereiro de 2026
