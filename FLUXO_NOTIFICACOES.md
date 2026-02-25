# 🔔 Fluxo Completo de Notificações - TechStore

## 📊 Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE NOTIFICAÇÕES                       │
│                                                                   │
│  Evento → Controller → Helper → Banco de Dados → Frontend       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Eventos e Notificações

### 1. 👤 CADASTRO DE USUÁRIO

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuário    │────▶│     Auth     │────▶│   Helper     │────▶│   Database   │
│  Cadastra    │     │  Controller  │     │ notifyWelcome│     │ Notification │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                        │
                                                                        ▼
                                                              ┌──────────────┐
                                                              │   Frontend   │
                                                              │  Sino 🔔     │
                                                              └──────────────┘

Mensagem: "👋 Bem-vindo à TechStore! Obrigado por se cadastrar..."
Tipo: SYSTEM
Link: /produtos
```

---

### 2. 🛍️ CRIAÇÃO DE PEDIDO

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│   Cliente    │────▶│    Order     │────▶│      Helper          │
│ Faz Pedido   │     │  Controller  │     │                      │
└──────────────┘     └──────────────┘     │  notifyNewOrder()    │──┐
                                           │  notifyVendorNew...()│  │
                                           └──────────────────────┘  │
                                                                      │
                     ┌────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   2 Notificações       │
        ├────────────────────────┤
        │ 1. Cliente:            │
        │    "🎉 Pedido          │
        │     Confirmado!"       │
        │                        │
        │ 2. Vendedor:           │
        │    "🛍️ Nova Venda!"   │
        └────────────────────────┘

Cliente recebe: "Seu pedido #ORD-XXX foi confirmado. Total: 50000 AOA"
Vendedor recebe: "Você vendeu 2x Laptop Dell no pedido #ORD-XXX"
Tipo: ORDER
```

---

### 3. 📦 MUDANÇA DE STATUS DO PEDIDO

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Vendedor    │────▶│    Order     │────▶│   Helper     │
│ Atualiza     │     │  Controller  │     │ notifyOrder  │
│   Status     │     │              │     │StatusChange()│
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                     ┌────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   Status Messages      │
        ├────────────────────────┤
        │ PROCESSING:            │
        │  "⏳ Processando"      │
        │                        │
        │ SHIPPING:              │
        │  "🚚 Enviado!"         │
        │                        │
        │ DELIVERED:             │
        │  "✅ Entregue!"        │
        │                        │
        │ CANCELLED:             │
        │  "❌ Cancelado"        │
        │                        │
        │ REFUNDED:              │
        │  "💰 Reembolsado"      │
        └────────────────────────┘

Tipo: ORDER
Link: /meus-pedidos
```

---

### 4. 📦 ESTOQUE BAIXO

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Vendedor    │────▶│   Product    │────▶│   Helper     │
│  Atualiza    │     │  Controller  │     │ notifyLow    │
│  Produto     │     │              │     │   Stock()    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                     ┌────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   Condição:            │
        │ stock <= threshold     │
        ├────────────────────────┤
        │ Exemplo:               │
        │ Stock: 5               │
        │ Threshold: 10          │
        │ → NOTIFICA!            │
        └────────────────────────┘

Mensagem: "⚠️ Estoque Baixo! O produto 'Laptop Dell' está com estoque baixo (5 unidades)"
Tipo: PRODUCT
Link: /gestao-estoque
```

---

### 5. ✅ VERIFICAÇÃO DE VENDEDOR

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│    Admin     │────▶│Verification  │────▶│      Helper          │
│  Aprova/     │     │  Controller  │     │                      │
│  Rejeita     │     │              │     │ notifyVerification   │
└──────────────┘     └──────────────┘     │ Approved/Rejected()  │
                                           └──────────────────────┘
                                                      │
                     ┌────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   2 Canais:            │
        ├────────────────────────┤
        │ 1. Email               │
        │    (sendEmail)         │
        │                        │
        │ 2. Notificação In-App  │
        │    (notifyHelper)      │
        └────────────────────────┘

APROVADA:
  Mensagem: "✅ Verificação Aprovada! Parabéns! Sua conta foi verificada..."
  Tipo: SYSTEM
  Link: /perfil-vendedor

REJEITADA:
  Mensagem: "❌ Verificação Não Aprovada - Motivo: [razão]"
  Tipo: SYSTEM
  Link: /vendor-verification
```

---

### 6. 💬 NOVA MENSAGEM NO CHAT

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuário    │────▶│     Chat     │────▶│   Helper     │
│    Envia     │     │  Controller  │     │ notifyNew    │
│  Mensagem    │     │              │     │  Message()   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                     ┌────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   Preview:             │
        │ Primeiros 50 chars     │
        ├────────────────────────┤
        │ "Olá! Tenho interesse  │
        │  no produto..."        │
        │                        │
        │ Se > 50 chars:         │
        │ "Olá! Tenho intere..." │
        └────────────────────────┘

Mensagem: "💬 Nova Mensagem - João Silva: Olá! Tenho interesse..."
Tipo: SYSTEM
Link: /chat
```

---

## 🔄 Fluxo Técnico Detalhado

### 1. Criação da Notificação

```javascript
// Controller chama helper
try {
  await notifyNewOrder(order);
} catch (notifError) {
  console.error('❌ Erro ao enviar notificação:', notifError);
}

// Helper cria no banco
await prisma.notification.create({
  data: {
    userId,
    type,
    title,
    message,
    link,
    isRead: false
  }
});

// Log de sucesso
console.log(`✅ Notificação criada para usuário ${userId}: ${title}`);
```

---

### 2. Frontend Busca Notificações

```javascript
// Auto-refresh a cada 30 segundos
useEffect(() => {
  fetchNotifications();
  const interval = setInterval(fetchNotifications, 30000);
  return () => clearInterval(interval);
}, []);

// Requisição
const response = await fetch('/api/notifications', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

### 3. Exibição no Frontend

```
┌─────────────────────────────────────┐
│  Header                             │
│                                     │
│  [Logo]  [Busca]  [🔔 3]  [Perfil] │
│                     │               │
│                     └──────┐        │
│                            ▼        │
│                   ┌────────────────┐│
│                   │ Notificações   ││
│                   ├────────────────┤│
│                   │ 🎉 Pedido      ││
│                   │    Confirmado! ││
│                   │    2 min atrás ││
│                   ├────────────────┤│
│                   │ 💬 Nova        ││
│                   │    Mensagem    ││
│                   │    5 min atrás ││
│                   ├────────────────┤│
│                   │ ⚠️ Estoque     ││
│                   │    Baixo       ││
│                   │    1 hora atrás││
│                   └────────────────┘│
└─────────────────────────────────────┘
```

---

## 📊 Tipos de Notificação

```
┌──────────────┬─────────────────────────────────────┐
│     TIPO     │           EXEMPLOS                  │
├──────────────┼─────────────────────────────────────┤
│   ORDER      │ • Pedido confirmado                 │
│              │ • Status atualizado                 │
│              │ • Nova venda                        │
├──────────────┼─────────────────────────────────────┤
│   PRODUCT    │ • Estoque baixo                     │
│              │ • Nova avaliação (futuro)           │
│              │ • Produto disponível (futuro)       │
├──────────────┼─────────────────────────────────────┤
│  PROMOTION   │ • Cupom disponível (futuro)         │
│              │ • Favorito em promoção (futuro)     │
│              │ • Carrinho abandonado (futuro)      │
├──────────────┼─────────────────────────────────────┤
│   SYSTEM     │ • Boas-vindas                       │
│              │ • Verificação aprovada/rejeitada    │
│              │ • Nova mensagem                     │
└──────────────┴─────────────────────────────────────┘
```

---

## ⚡ Performance e Escalabilidade

### Atual (Implementado):
```
Evento → Prisma.create() → Banco de Dados
         (Síncrono)
```

### Recomendado para Produção:
```
Evento → Fila (Redis/RabbitMQ) → Worker → Banco de Dados
         (Assíncrono)
```

### Real-time (Futuro):
```
Evento → WebSocket (Socket.io) → Cliente
         (Instantâneo)
```

---

## 🎯 Estatísticas de Uso

### Notificações por Ação:

| Ação                    | Notificações | Destinatários        |
|-------------------------|--------------|----------------------|
| Cadastro                | 1            | Novo usuário         |
| Criar Pedido            | 1 + N        | Cliente + Vendedores |
| Atualizar Status        | 1            | Cliente              |
| Atualizar Produto       | 0-1          | Vendedor (se baixo)  |
| Aprovar Verificação     | 1            | Vendedor             |
| Rejeitar Verificação    | 1            | Vendedor             |
| Enviar Mensagem         | 1            | Destinatário         |

**N** = Número de vendedores diferentes no pedido

---

## 🔐 Segurança

### Validações Implementadas:

1. ✅ **Autenticação**: Apenas usuários logados recebem notificações
2. ✅ **Autorização**: Usuário só vê suas próprias notificações
3. ✅ **Sanitização**: Mensagens são escapadas no frontend
4. ✅ **Rate Limiting**: Frontend busca a cada 30s (não sobrecarrega)

---

## 📈 Métricas Sugeridas

### Para Monitoramento:

1. **Taxa de Criação**: Notificações criadas por minuto
2. **Taxa de Leitura**: % de notificações lidas
3. **Tempo de Resposta**: Tempo até usuário ver notificação
4. **Taxa de Erro**: Falhas ao criar notificação
5. **Notificações por Usuário**: Média de notificações por usuário

---

## 🎉 Conclusão

O sistema de notificações está totalmente integrado e funcional, cobrindo todos os eventos principais da plataforma. O fluxo é simples, eficiente e escalável.

**Status**: ✅ PRODUÇÃO READY
**Data**: 25 de Fevereiro de 2026
