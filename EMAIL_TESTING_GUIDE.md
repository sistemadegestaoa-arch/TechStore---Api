# 📧 Guia de Teste de Email - TechStore

## ✅ Correções Implementadas

### 1. Configuração SMTP (.env)
- Removidas aspas dos valores `SMTP_USER` e `SMTP_PASS`
- Corrigido `EMAIL_FROM` para usar o email correto
- Configuração agora está limpa e sem erros de sintaxe

### 2. Logs Detalhados
Adicionados logs completos em:
- `emailService.js`: Logs de tentativa, sucesso e erro de envio
- `newsletter.controller.js`: Logs de início, progresso e conclusão
- `product.controller.js`: Log quando produto ACTIVE é criado
- `category.controller.js`: Log quando categoria é criada

### 3. Verificação SMTP
- Adicionada verificação automática da conexão SMTP ao iniciar o servidor
- Mostra se o servidor está pronto para enviar emails

## 🧪 Como Testar

### Passo 1: Testar Configuração SMTP
```bash
cd backend
node test-email.js
```

Este script vai:
1. Mostrar as configurações SMTP
2. Tentar enviar um email de teste para você mesmo
3. Mostrar se funcionou ou não

**Resultado esperado:**
```
✅ SMTP Server is ready to send emails
📤 Enviando email de teste...
✅ Email enviado com sucesso!
```

### Passo 2: Reiniciar o Servidor Backend
```bash
cd backend
npm start
```

**Verifique no console:**
```
✅ SMTP Server is ready to send emails
   Host: smtp.gmail.com
   Port: 587
   User: domingosluandakalepa@gmail.com
```

### Passo 3: Testar Notificação de Nova Categoria

1. Faça login como ADMIN
2. Crie uma nova categoria
3. Verifique o console do backend:

```
🔔 Categoria criada, iniciando notificação para vendedores...
🔔 Iniciando notificação de nova categoria: [Nome da Categoria]
📊 Total de vendedores ativos: X
📤 Enviando emails para vendedores...
   ✅ Enviado para: vendedor1@email.com
   ✅ Enviado para: vendedor2@email.com

✅ Notificação de nova categoria concluída:
   📧 Enviados: 2
   ❌ Falharam: 0
   📊 Total: 2
```

4. Verifique o email dos vendedores

### Passo 4: Testar Notificação de Novo Produto

1. Faça login como VENDEDOR
2. Cadastre um novo produto (certifique-se que o status é ACTIVE)
3. Verifique o console do backend:

```
🔔 Produto ACTIVE criado, iniciando notificação...
🔔 Iniciando notificação de novo produto: [Nome do Produto]
📊 Total de inscritos ativos: X
📤 Enviando emails para inscritos...
   ✅ Enviado para: cliente1@email.com
   ✅ Enviado para: cliente2@email.com

✅ Notificação de novo produto concluída:
   📧 Enviados: 2
   ❌ Falharam: 0
   📊 Total: 2
```

4. Verifique o email dos inscritos na newsletter

## 🔍 Troubleshooting

### Problema: "SMTP Configuration Error"
**Solução:**
1. Verifique se o arquivo `.env` está correto
2. Certifique-se que não há aspas nos valores
3. Verifique se a senha de aplicativo do Gmail está correta

### Problema: "Authentication failed"
**Solução:**
1. Verifique se você está usando uma "Senha de Aplicativo" do Gmail (não a senha normal)
2. Para criar uma senha de aplicativo:
   - Acesse: https://myaccount.google.com/apppasswords
   - Crie uma nova senha de aplicativo
   - Use essa senha no `SMTP_PASS`

### Problema: Emails não chegam
**Solução:**
1. Verifique a pasta de SPAM
2. Verifique se há inscritos na newsletter (para produtos)
3. Verifique se há vendedores ativos (para categorias)
4. Verifique os logs do console para ver se houve erro

### Problema: "Nenhum inscrito na newsletter"
**Solução:**
1. Inscreva-se na newsletter pela página inicial
2. Verifique no banco de dados se o registro foi criado:
```sql
SELECT * FROM "Newsletter" WHERE "isActive" = true;
```

### Problema: "Nenhum vendedor ativo encontrado"
**Solução:**
1. Certifique-se que existe pelo menos um usuário com role='VENDOR' e isActive=true
2. Verifique no banco de dados:
```sql
SELECT * FROM "User" WHERE role = 'VENDOR' AND "isActive" = true;
```

## 📋 Checklist de Verificação

- [ ] Arquivo `.env` configurado corretamente (sem aspas)
- [ ] Senha de aplicativo do Gmail criada e configurada
- [ ] Teste de email (`node test-email.js`) passou
- [ ] Servidor backend mostra "SMTP Server is ready"
- [ ] Existe pelo menos 1 inscrito na newsletter
- [ ] Existe pelo menos 1 vendedor ativo
- [ ] Console mostra logs detalhados ao criar categoria/produto
- [ ] Emails chegam na caixa de entrada (verificar SPAM também)

## 📧 Templates de Email

### Email para Cliente (Novo Produto)
- Assunto: `🎉 Novo Produto na TechStore: [Nome do Produto]`
- Conteúdo: Imagem, descrição, preço, botão "Ver Produto e Comprar Agora"
- Enviado para: Todos os inscritos ativos na newsletter

### Email para Vendedor (Nova Categoria)
- Assunto: `🎯 Nova Categoria na TechStore: [Nome da Categoria]`
- Conteúdo: Saudação personalizada, ícone da categoria, lista de oportunidades, botão "Cadastrar Produto Agora"
- Enviado para: Todos os vendedores ativos

## 🎯 Próximos Passos

Se tudo estiver funcionando:
1. ✅ Emails de nova categoria funcionando
2. ✅ Emails de novo produto funcionando
3. ✅ Logs detalhados implementados
4. ✅ Templates HTML profissionais criados

Se ainda houver problemas, verifique os logs do console para identificar onde está falhando.
