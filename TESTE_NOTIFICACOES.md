# 🧪 Guia de Teste - Notificações Automáticas

## ⚠️ ANTES DE TESTAR

### 1. Rodar Migration (OBRIGATÓRIO)
```bash
cd backend
npx prisma migrate dev --name add_all_features
npx prisma generate
```

### 2. Reiniciar o Servidor
```bash
npm run dev
```

---

## 🧪 Cenários de Teste

### 1️⃣ Notificação de Boas-vindas

**Como testar:**
1. Acesse a página de cadastro
2. Crie uma nova conta (cliente ou vendedor)
3. Após o cadastro, clique no sino 🔔 no header
4. Você deve ver: "👋 Bem-vindo à TechStore!"

**Endpoint:** `POST /api/auth/register` ou `POST /api/auth/register-vendor`

---

### 2️⃣ Notificação de Novo Pedido

**Como testar:**
1. Faça login como cliente
2. Adicione produtos ao carrinho
3. Finalize a compra
4. Clique no sino 🔔
5. Você deve ver: "🎉 Pedido Confirmado! Seu pedido #ORD-XXX foi confirmado..."

**Endpoint:** `POST /api/orders`

**Vendedor também recebe:**
- Faça login como o vendedor do produto
- Clique no sino 🔔
- Você deve ver: "🛍️ Nova Venda! Você vendeu 1x [Nome do Produto]..."

---

### 3️⃣ Notificação de Mudança de Status

**Como testar:**
1. Faça login como vendedor
2. Acesse "Gerenciar Pedidos"
3. Mude o status de um pedido (ex: PENDING → SHIPPING)
4. Faça login como o cliente desse pedido
5. Clique no sino 🔔
6. Você deve ver: "🚚 Seu pedido foi enviado!"

**Endpoint:** `PATCH /api/orders/:id/status`

**Mensagens por status:**
- PROCESSING: "⏳ Seu pedido está sendo processado"
- SHIPPING: "🚚 Seu pedido foi enviado!"
- DELIVERED: "✅ Seu pedido foi entregue!"
- CANCELLED: "❌ Seu pedido foi cancelado"
- REFUNDED: "💰 Seu pedido foi reembolsado"

---

### 4️⃣ Notificação de Estoque Baixo

**Como testar:**
1. Faça login como vendedor
2. Acesse "Gestão de Estoque"
3. Edite um produto e defina:
   - Estoque: 5 unidades
   - Limite Mínimo: 10 unidades
4. Salve o produto
5. Clique no sino 🔔
6. Você deve ver: "⚠️ Estoque Baixo! O produto '[Nome]' está com estoque baixo (5 unidades)"

**Endpoint:** `PUT /api/products/:id`

**Condição:** `stock <= lowStockThreshold`

---

### 5️⃣ Notificação de Verificação Aprovada

**Como testar:**
1. Faça login como vendedor
2. Solicite verificação em "Verificação de Vendedor"
3. Faça login como admin
4. Acesse "Admin → Verificações"
5. Aprove a verificação do vendedor
6. Faça login novamente como o vendedor
7. Clique no sino 🔔
8. Você deve ver: "✅ Verificação Aprovada! Parabéns! Sua conta foi verificada..."

**Endpoint:** `PATCH /api/verifications/:id/approve`

---

### 6️⃣ Notificação de Verificação Rejeitada

**Como testar:**
1. Siga os passos 1-4 do teste anterior
2. Rejeite a verificação com um motivo
3. Faça login como o vendedor
4. Clique no sino 🔔
5. Você deve ver: "❌ Verificação Não Aprovada - Motivo: [motivo]"

**Endpoint:** `PATCH /api/verifications/:id/reject`

---

### 7️⃣ Notificação de Nova Mensagem

**Como testar:**
1. Faça login como cliente
2. Acesse um produto
3. Clique no botão de chat/mensagem
4. Envie uma mensagem para o vendedor
5. Faça login como o vendedor
6. Clique no sino 🔔
7. Você deve ver: "💬 Nova Mensagem - [Nome do Cliente]: [preview da mensagem]"

**Endpoint:** `POST /api/chat/messages`

---

## 🔍 Verificação Manual no Banco de Dados

### Consultar notificações criadas:
```sql
SELECT * FROM "Notification" ORDER BY "createdAt" DESC LIMIT 10;
```

### Verificar notificações de um usuário:
```sql
SELECT * FROM "Notification" 
WHERE "userId" = 'USER_ID_AQUI' 
ORDER BY "createdAt" DESC;
```

### Contar notificações não lidas:
```sql
SELECT COUNT(*) FROM "Notification" 
WHERE "userId" = 'USER_ID_AQUI' AND "isRead" = false;
```

---

## 🐛 Troubleshooting

### Notificações não aparecem?

1. **Verifique o console do backend:**
   - Deve mostrar: `✅ Notificação criada para usuário XXX: [título]`
   - Se mostrar erro: `❌ Erro ao criar notificação:` → verifique migration

2. **Verifique o console do frontend:**
   - Deve fazer requisição a cada 30s: `GET /api/notifications`
   - Verifique se o token está sendo enviado no header

3. **Verifique o banco de dados:**
   - Execute: `SELECT * FROM "Notification" LIMIT 5;`
   - Se tabela não existe → rode a migration

4. **Verifique se o usuário está autenticado:**
   - Notificações só funcionam para usuários logados
   - Verifique se o token JWT é válido

### Migration não roda?

```bash
# Resetar banco (CUIDADO: apaga dados)
npx prisma migrate reset

# Rodar migration novamente
npx prisma migrate dev --name add_all_features

# Gerar cliente Prisma
npx prisma generate
```

---

## 📊 Checklist de Teste

- [ ] ✅ Notificação de boas-vindas (cadastro)
- [ ] ✅ Notificação de novo pedido (cliente)
- [ ] ✅ Notificação de nova venda (vendedor)
- [ ] ✅ Notificação de mudança de status (SHIPPING)
- [ ] ✅ Notificação de mudança de status (DELIVERED)
- [ ] ✅ Notificação de estoque baixo
- [ ] ✅ Notificação de verificação aprovada
- [ ] ✅ Notificação de verificação rejeitada
- [ ] ✅ Notificação de nova mensagem
- [ ] ✅ Badge de contagem no sino atualiza
- [ ] ✅ Marcar como lida funciona
- [ ] ✅ Link da notificação redireciona corretamente

---

## 🎯 Resultado Esperado

Após todos os testes, você deve ter:

1. ✅ Notificações aparecendo no sino do header
2. ✅ Badge com número de notificações não lidas
3. ✅ Notificações marcadas como lidas ao clicar
4. ✅ Links funcionando corretamente
5. ✅ Auto-refresh a cada 30 segundos
6. ✅ Logs no console do backend confirmando criação

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do backend
2. Verifique o console do navegador
3. Consulte `NOTIFICACOES_INTEGRADAS.md` para detalhes técnicos
4. Verifique se a migration foi executada corretamente

**Data de Criação**: 25 de Fevereiro de 2026
