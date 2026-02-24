# TechStore Backend API

Backend API para plataforma de e-commerce com sistema de vendedores.

## Tecnologias

- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT Authentication
- Bcrypt para hash de senhas
- Nodemailer para envio de emails
- Multer para upload de arquivos

## Instalação

1. Instalar dependências:
```bash
cd backend
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/techstore?schema=public"
```

3. Criar banco de dados PostgreSQL:
```sql
CREATE DATABASE techstore;
```

4. Executar migrations do Prisma:
```bash
npx prisma migrate dev --name init
```

5. (Opcional) Popular banco com dados de exemplo:
```bash
npm run prisma:seed
```

6. Iniciar servidor:
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

O servidor estará rodando em `http://localhost:5000`

## Comandos Prisma

```bash
# Gerar Prisma Client
npx prisma generate

# Criar migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations em produção
npx prisma migrate deploy

# Abrir Prisma Studio (interface visual do banco)
npx prisma studio

# Popular banco com dados de exemplo
npm run prisma:seed

# Resetar banco de dados (CUIDADO!)
npx prisma migrate reset
```

## Estrutura do Projeto

```
backend/
├── prisma/
│   ├── schema.prisma    # Schema do banco de dados
│   └── seed.js          # Dados iniciais
├── src/
│   ├── config/          # Configurações (prisma, etc)
│   ├── controllers/     # Controladores das rotas
│   ├── middleware/      # Middlewares (auth, validation, etc)
│   ├── routes/          # Definição de rotas
│   └── utils/           # Utilitários (email, tokens, etc)
├── uploads/             # Arquivos enviados
├── .env                 # Variáveis de ambiente
├── .env.example         # Exemplo de variáveis
├── server.js            # Entrada da aplicação
└── package.json
```

## Modelos de Dados

### User
- Clientes e Vendedores
- Campos específicos para vendedores (storeName, commissionRate, etc)
- Autenticação e verificação de email

### Product
- Produtos cadastrados por vendedores
- Estoque, preço, imagens, especificações
- Status e condição do produto

### Order
- Pedidos realizados por clientes
- Informações de entrega e pagamento
- Status e rastreamento

### OrderItem
- Itens de cada pedido
- Cálculo de comissão (8%)
- Ganhos do vendedor

### Review
- Avaliações de produtos
- Rating de 1 a 5 estrelas
- Resposta do vendedor

### Category
- Categorias de produtos
- Organização do catálogo

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Cadastro de cliente
- `POST /api/auth/register-vendor` - Cadastro de vendedor
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verificar email
- `POST /api/auth/forgot-password` - Solicitar reset de senha
- `POST /api/auth/reset-password` - Redefinir senha
- `GET /api/auth/me` - Obter usuário atual (protegido)

### Usuários
- `GET /api/users/profile` - Obter perfil
- `PUT /api/users/profile` - Atualizar perfil
- `PUT /api/users/password` - Alterar senha
- `DELETE /api/users/account` - Deletar conta

### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Obter produto
- `POST /api/products` - Criar produto (vendedor)
- `PUT /api/products/:id` - Atualizar produto (vendedor)
- `DELETE /api/products/:id` - Deletar produto (vendedor)

### Pedidos
- `GET /api/orders` - Listar pedidos do usuário
- `GET /api/orders/:id` - Obter pedido
- `POST /api/orders` - Criar pedido (cliente)
- `PUT /api/orders/:id/status` - Atualizar status (vendedor)
- `GET /api/orders/vendor/all` - Pedidos do vendedor

### Categorias
- `GET /api/categories` - Listar categorias
- `GET /api/categories/:id` - Obter categoria

### Avaliações
- `GET /api/reviews/product/:productId` - Avaliações do produto
- `POST /api/reviews` - Criar avaliação (cliente)
- `PUT /api/reviews/:id` - Atualizar avaliação
- `DELETE /api/reviews/:id` - Deletar avaliação

## Comissão de Vendas

O sistema cobra 8% de comissão sobre cada venda:
- Valor do produto: 1000 kz
- Comissão (8%): 80 kz
- Ganho do vendedor: 920 kz

## Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT
- Validação de dados com express-validator
- Helmet para headers de segurança
- Rate limiting para prevenir abuso
- CORS configurado

## Dados de Exemplo (após seed)

```
Admin: admin@techstore.com / admin123
Vendedor: vendedor@techstore.com / vendor123
Cliente: cliente@techstore.com / customer123
```

## Desenvolvimento

```bash
# Instalar nodemon globalmente (opcional)
npm install -g nodemon

# Rodar em modo desenvolvimento
npm run dev

# Abrir Prisma Studio
npx prisma studio
```

## Próximos Passos

1. Implementar controladores de produtos
2. Implementar controladores de pedidos
3. Implementar upload de imagens
4. Implementar sistema de pagamento
5. Implementar notificações em tempo real
6. Implementar dashboard de analytics
