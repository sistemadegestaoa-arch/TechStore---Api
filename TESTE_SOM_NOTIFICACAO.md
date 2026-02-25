# 🔊 Guia de Teste - Som e Notificações em Tempo Real

## ⚡ Teste Rápido (2 minutos)

### Preparação:
```bash
# 1. Rodar migration (se ainda não rodou)
cd backend
npx prisma migrate dev --name add_all_features
npx prisma generate

# 2. Iniciar backend
npm run dev

# 3. Iniciar frontend (em outro terminal)
cd frontend
npm start
```

---

## 🧪 Teste 1: Som de Notificação + Animação

### Objetivo: Verificar se o som toca e o sino treme

**Passos:**

1. **Abra 2 abas do navegador**
   - Aba 1: `http://localhost:3000`
   - Aba 2: `http://localhost:3000`

2. **Aba 1: Faça login como CLIENTE**
   - Email: qualquer cliente
   - Deixe a aba aberta

3. **Aba 2: Faça login como VENDEDOR**
   - Email: vendedor@example.com
   - Senha: senha123

4. **Aba 2: Cadastre um produto**
   - Vá em "Adicionar Produto"
   - Preencha os dados
   - Status: ACTIVE (importante!)
   - Clique em "Cadastrar"

5. **Aba 1: Aguarde 10 segundos**
   - Fique de olho no sino 🔔
   - Volume do computador ligado!

**Resultado Esperado:**
- ✅ Som duplo toca: "ding-ding" 🔊
- ✅ Sino treme por 0.5 segundos 🔔
- ✅ Badge vermelho aparece/atualiza (ex: 1, 2, 3...)
- ✅ Notificação aparece no dropdown: "🆕 Novo Produto Disponível!"

**Se não funcionar:**
- Verifique se o volume está ligado
- Verifique se o navegador permite autoplay de áudio
- Abra o console (F12) e veja se há erros
- Clique em qualquer lugar da página primeiro (política de autoplay)

---

## 🧪 Teste 2: Nome do Cliente na Notificação

### Objetivo: Verificar se vendedor vê nome do cliente que comprou

**Passos:**

1. **Aba 1: Faça login como CLIENTE "João Silva"**
   - Se não existir, crie uma conta com esse nome

2. **Aba 2: Faça login como VENDEDOR**
   - Certifique-se de ter produtos cadastrados

3. **Aba 1: Compre um produto do vendedor**
   - Adicione ao carrinho
   - Finalize a compra
   - Preencha endereço
   - Confirme pedido

4. **Aba 2: Aguarde 10 segundos**
   - Fique de olho no sino 🔔

**Resultado Esperado:**
- ✅ Som toca 🔊
- ✅ Sino treme 🔔
- ✅ Notificação aparece: "🛍️ Nova Venda!"
- ✅ Mensagem: "João Silva comprou 1x [Nome do Produto] no pedido #ORD-XXX"

---

## 🧪 Teste 3: Notificação em Massa

### Objetivo: Verificar se todos os clientes recebem notificação

**Passos:**

1. **Crie 3 contas de CLIENTE**
   - Cliente 1: cliente1@test.com
   - Cliente 2: cliente2@test.com
   - Cliente 3: cliente3@test.com

2. **Abra 4 abas:**
   - Aba 1: Login como Cliente 1
   - Aba 2: Login como Cliente 2
   - Aba 3: Login como Cliente 3
   - Aba 4: Login como Vendedor

3. **Aba 4: Cadastre um produto (status: ACTIVE)**

4. **Abas 1, 2, 3: Aguarde 10 segundos em cada**

**Resultado Esperado:**
- ✅ TODOS os 3 clientes recebem notificação
- ✅ Som toca em todas as abas 🔊
- ✅ Sino treme em todas as abas 🔔
- ✅ Mensagem: "🆕 Novo Produto Disponível! [Nome] - [Preço] AOA"

---

## 🧪 Teste 4: Badge Pulsante

### Objetivo: Verificar animação do badge

**Passos:**

1. Faça login como qualquer usuário
2. Receba algumas notificações (não leia)
3. Observe o badge vermelho no sino

**Resultado Esperado:**
- ✅ Badge pulsa continuamente (escala 1.0 → 1.1 → 1.0)
- ✅ Badge tem brilho vermelho ao redor
- ✅ Número de notificações não lidas aparece

---

## 🧪 Teste 5: Atualização Automática

### Objetivo: Verificar polling a cada 10 segundos

**Passos:**

1. Abra 2 abas
2. Aba 1: Login como cliente
3. Aba 2: Login como vendedor
4. Aba 2: Cadastre produto
5. Aba 1: NÃO clique em nada, apenas aguarde

**Resultado Esperado:**
- ✅ Em até 10 segundos, notificação aparece automaticamente
- ✅ Som toca sem precisar atualizar página
- ✅ Badge atualiza automaticamente

---

## 🔍 Verificação no Console

### Console do Navegador (F12):

**Logs esperados:**
```
🔔 Som de notificação tocado!
```

**Se aparecer erro:**
```
The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
```

**Solução:** Clique em qualquer lugar da página primeiro

---

### Console do Backend:

**Logs esperados ao cadastrar produto:**
```
📦 Criando produto...
✅ Produto criado com sucesso: [ID]
🔔 Produto ACTIVE criado, iniciando notificação...
📢 Notificando 5 clientes sobre novo produto: [Nome]
✅ 5 notificações criadas para novo produto!
```

**Logs esperados ao criar pedido:**
```
✅ Notificação criada para usuário [ID]: 🎉 Pedido Confirmado!
✅ Notificação criada para usuário [ID]: 🛍️ Nova Venda!
```

---

## 🐛 Troubleshooting

### Som não toca?

**Problema 1: Autoplay bloqueado**
```
Solução: Clique em qualquer lugar da página primeiro
```

**Problema 2: Volume desligado**
```
Solução: Verifique volume do sistema e do navegador
```

**Problema 3: Navegador não suporta Web Audio API**
```
Solução: Use Chrome, Firefox, Edge ou Safari atualizado
```

---

### Sino não treme?

**Problema: CSS não carregou**
```
Solução: 
1. Limpe cache (Ctrl + Shift + Delete)
2. Recarregue página (Ctrl + F5)
3. Verifique console por erros
```

---

### Notificação não aparece?

**Problema 1: Migration não rodou**
```bash
cd backend
npx prisma migrate status
npx prisma migrate dev --name add_all_features
```

**Problema 2: Usuário não está autenticado**
```
Solução: Faça login novamente
```

**Problema 3: Produto não está ACTIVE**
```
Solução: Ao cadastrar produto, certifique-se que status = ACTIVE
```

---

### Notificação em massa não funciona?

**Verificar no banco:**
```sql
-- Ver quantos clientes existem
SELECT COUNT(*) FROM "User" WHERE role = 'CUSTOMER' AND "isActive" = true;

-- Ver notificações criadas
SELECT * FROM "Notification" 
WHERE type = 'PRODUCT' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

**Se não há clientes:**
```
Solução: Crie pelo menos 2 contas de cliente
```

---

## 📊 Checklist de Teste

### Funcionalidades Básicas:
- [ ] Som toca quando nova notificação chega
- [ ] Sino treme quando nova notificação chega
- [ ] Badge pulsa continuamente
- [ ] Badge mostra número correto de não lidas
- [ ] Notificações aparecem no dropdown
- [ ] Marcar como lida funciona
- [ ] Link redireciona corretamente

### Notificações Específicas:
- [ ] Novo produto → Todos os clientes recebem
- [ ] Nova compra → Vendedor vê nome do cliente
- [ ] Status do pedido → Cliente recebe
- [ ] Estoque baixo → Vendedor recebe
- [ ] Verificação → Vendedor recebe
- [ ] Nova mensagem → Destinatário recebe

### Performance:
- [ ] Atualização a cada 10 segundos funciona
- [ ] Som não toca múltiplas vezes (apenas 1x por notificação)
- [ ] Notificação em massa não trava (mesmo com muitos clientes)

---

## 🎯 Resultado Esperado Final

Após todos os testes, você deve ter:

✅ Sistema de notificações funcionando 100%  
✅ Som tocando em tempo real  
✅ Animações visuais funcionando  
✅ Todos os clientes recebendo notificações de novos produtos  
✅ Vendedores vendo nome dos clientes que compraram  
✅ Atualização automática a cada 10 segundos  

---

## 📹 Vídeo de Demonstração (Sugestão)

Grave um vídeo mostrando:
1. Cadastro de produto
2. Som tocando
3. Sino tremendo
4. Badge pulsando
5. Notificação aparecendo

Isso ajuda a documentar e mostrar para a equipe!

---

## 🎉 Conclusão

Se todos os testes passaram, parabéns! 🎉

Seu sistema de notificações em tempo real está funcionando perfeitamente, igual às redes sociais!

**Data de Teste:** ___/___/______  
**Testado por:** ________________  
**Status:** [ ] Aprovado [ ] Reprovado

---

**Última Atualização:** 25 de Fevereiro de 2026
