# Guia de API - Funcionalidades de Vendedor

## 🚀 Configuração Inicial

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente
Certifique-se de que o arquivo `.env` contém:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/techstore"
JWT_SECRET="seu_jwt_secret"
CLOUDINARY_CLOUD_NAME="seu_cloud_name"
CLOUDINARY_API_KEY="sua_api_key"
CLOUDINARY_API_SECRET="seu_api_secret"
```

### 3. Executar Migrations e Seed
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Iniciar Servidor
```bash
npm run dev
```

---

## 📦 API de Produtos

### Listar Todos os Produtos (Público)
```http
GET /api/products
Query Params:
  - page: número da página (padrão: 1)
  - limit: itens por página (padrão: 12)
  - category: ID da categoria
  - status: ACTIVE, INACTIVE, PENDING, OUT_OF_STOCK
  - vendorId: ID do vendedor
  - search: termo de busca
  - sortBy: campo para ordenar (padrão: createdAt)
  - order: asc ou desc (padrão: desc)
```

### Buscar Produto por ID (Público)
```http
GET /api/products/:id
```

### Listar Produtos do Vendedor (Privado - Vendedor)
```http
GET /api/products/vendor/my-products
Headers:
  Authorization: Bearer {token}
Query Params:
  - page, limit, status, search, sortBy, order
```

### Criar Produto (Privado - Vendedor)
```http
POST /api/products
Headers:
  Authorization: Bearer {token}
  Content-Type: multipart/form-data

Body (form-data):
  - name: string (obrigatório)
  - description: string (obrigatório)
  - price: number (obrigatório)
  - comparePrice: number (opcional)
  - sku: string (obrigatório, único)
  - stock: number (obrigatório)
  - lowStockThreshold: number (opcional, padrão: 10)
  - brand: string (opcional)
  - condition: NEW, USED, REFURBISHED (padrão: NEW)
  - categoryId: string (obrigatório)
  - specifications: JSON string (opcional)
  - weight: number (opcional)
  - dimensions: JSON string (opcional)
  - images: file[] (até 10 imagens)

Exemplo:
{
  "name": "Notebook Dell Inspiron",
  "description": "Notebook com Intel i7, 16GB RAM",
  "price": 3500,
  "comparePrice": 4000,
  "sku": "DELL-NB-001",
  "stock": 15,
  "brand": "Dell",
  "condition": "NEW",
  "categoryId": "uuid-da-categoria",
  "specifications": "{\"processor\":\"Intel i7\",\"ram\":\"16GB\"}",
  "images": [arquivo1.jpg, arquivo2.jpg]
}
```

### Atualizar Produto (Privado - Vendedor)
```http
PUT /api/products/:id
Headers:
  Authorization: Bearer {token}
  Content-Type: multipart/form-data

Body: Mesmos campos do POST (todos opcionais)
```

### Atualizar Status do Produto (Privado - Vendedor)
```http
PATCH /api/products/:id/status
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "status": "ACTIVE" | "INACTIVE" | "PENDING" | "OUT_OF_STOCK"
}
```

### Deletar Produto (Privado - Vendedor)
```http
DELETE /api/products/:id
Headers:
  Authorization: Bearer {token}
```

---

## 📂 API de Categorias

### Listar Categorias (Público)
```http
GET /api/categories
Query Params:
  - isActive: true/false
```

### Buscar Categoria por ID (Público)
```http
GET /api/categories/:id
```

### Criar Categoria (Privado - Admin)
```http
POST /api/categories
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "name": "Eletrônicos",
  "description": "Produtos eletrônicos",
  "icon": "💻"
}
```

---

## 🛒 API de Pedidos

### Criar Pedido (Privado - Cliente)
```http
POST /api/orders
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "items": [
    {
      "productId": "uuid-do-produto",
      "quantity": 2
    }
  ],
  "shippingAddress": "Rua Principal, 123",
  "shippingCity": "Luanda",
  "shippingProvince": "Luanda",
  "shippingPostalCode": "12345",
  "shippingPhone": "+244999999999",
  "paymentMethod": "CREDIT_CARD",
  "customerNotes": "Entregar pela manhã"
}
```

### Listar Pedidos do Cliente (Privado - Cliente)
```http
GET /api/orders
Headers:
  Authorization: Bearer {token}
Query Params:
  - page, limit, status
```

### Listar Pedidos do Vendedor (Privado - Vendedor)
```http
GET /api/orders/vendor/all
Headers:
  Authorization: Bearer {token}
Query Params:
  - page, limit, status
```

### Buscar Pedido por ID (Privado)
```http
GET /api/orders/:id
Headers:
  Authorization: Bearer {token}
```

### Atualizar Status do Pedido (Privado - Vendedor)
```http
PATCH /api/orders/:id/status
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "status": "PENDING" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "CANCELLED",
  "trackingNumber": "BR123456789" (opcional, para status SHIPPING)
}
```

### Estatísticas do Vendedor (Privado - Vendedor)
```http
GET /api/orders/vendor/stats
Headers:
  Authorization: Bearer {token}
Query Params:
  - startDate: YYYY-MM-DD (opcional)
  - endDate: YYYY-MM-DD (opcional)

Resposta:
{
  "totalOrders": 23,
  "totalRevenue": 45280,
  "totalCommission": 3622.4,
  "totalEarnings": 41657.6,
  "ordersByStatus": {
    "PENDING": 5,
    "PROCESSING": 8,
    "DELIVERED": 10
  },
  "productCount": 47,
  "activeProductCount": 42,
  "averageOrderValue": 1968.7
}
```

---

## 🔐 Autenticação

### Login
```http
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "vendedor@techstore.com",
  "password": "vendor123"
}

Resposta:
{
  "token": "jwt_token_aqui",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "vendedor@techstore.com",
    "role": "VENDOR",
    "storeName": "TechStore Premium"
  }
}
```

---

## 📊 Status e Enums

### Product Status
- `ACTIVE` - Produto ativo e visível
- `INACTIVE` - Produto inativo
- `PENDING` - Aguardando aprovação
- `OUT_OF_STOCK` - Sem estoque

### Product Condition
- `NEW` - Novo
- `USED` - Usado
- `REFURBISHED` - Recondicionado

### Order Status
- `PENDING` - Pendente
- `PROCESSING` - Processando
- `SHIPPING` - Em trânsito
- `DELIVERED` - Entregue
- `CANCELLED` - Cancelado
- `REFUNDED` - Reembolsado

### Payment Method
- `CREDIT_CARD` - Cartão de crédito
- `DEBIT_CARD` - Cartão de débito
- `BANK_TRANSFER` - Transferência bancária
- `CASH_ON_DELIVERY` - Pagamento na entrega
- `MOBILE_MONEY` - Dinheiro móvel

---

## 🧪 Testando com cURL

### Exemplo: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendedor@techstore.com","password":"vendor123"}'
```

### Exemplo: Criar Produto
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "name=Notebook Dell" \
  -F "description=Notebook com Intel i7" \
  -F "price=3500" \
  -F "sku=DELL-001" \
  -F "stock=10" \
  -F "categoryId=UUID_CATEGORIA" \
  -F "images=@/caminho/para/imagem.jpg"
```

### Exemplo: Listar Produtos do Vendedor
```bash
curl -X GET "http://localhost:5000/api/products/vendor/my-products?page=1&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📝 Notas Importantes

1. **Upload de Imagens**: As imagens são enviadas para o Cloudinary automaticamente
2. **Comissão**: A comissão padrão é 8% sobre cada venda
3. **Estoque**: O estoque é decrementado automaticamente ao criar um pedido
4. **Autorização**: Vendedores só podem gerenciar seus próprios produtos
5. **Status Inicial**: Produtos criados começam com status `PENDING`

---

## 🐛 Troubleshooting

### Erro: "SKU já existe"
- Cada produto deve ter um SKU único
- Verifique se o SKU não está sendo usado por outro produto

### Erro: "Não autorizado"
- Verifique se o token JWT está correto
- Confirme que o usuário tem a role correta (VENDOR)

### Erro: "Categoria não encontrada"
- Execute o seed para criar categorias: `npx prisma db seed`
- Verifique se o categoryId está correto

### Erro de Upload de Imagem
- Verifique as credenciais do Cloudinary no .env
- Confirme que o formato da imagem é suportado (jpg, png, gif, webp)
- Tamanho máximo: 5MB por imagem
