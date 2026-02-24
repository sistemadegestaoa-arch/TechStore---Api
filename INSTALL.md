# Guia de Instalação - TechStore Backend

## Pré-requisitos

1. **Node.js** (versão 16 ou superior)
   - Download: https://nodejs.org/

2. **PostgreSQL** (versão 12 ou superior)
   - Download: https://www.postgresql.org/download/

3. **Git** (opcional, para clonar o repositório)

## Passo a Passo

### 1. Instalar PostgreSQL

#### Windows:
1. Baixe o instalador do PostgreSQL
2. Execute o instalador
3. Anote a senha do usuário `postgres`
4. Porta padrão: 5432

#### Verificar instalação:
```bash
psql --version
```

### 2. Criar Banco de Dados

Abra o terminal/cmd e execute:

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE techstore;

# Sair
\q
```

Ou use o pgAdmin (interface gráfica) para criar o banco.

### 3. Configurar Backend

```bash
# Navegar para pasta backend
cd backend

# Instalar dependências
npm install
```

### 4. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Server
PORT=5000
NODE_ENV=development

# Database - IMPORTANTE: Configure com suas credenciais
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techstore
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_AQUI

# JWT - IMPORTANTE: Mude para uma chave secreta forte
JWT_SECRET=sua_chave_secreta_super_segura_aqui
JWT_EXPIRE=7d

# Email (opcional para testes iniciais)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_app
EMAIL_FROM=TechStore <noreply@techstore.com>

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 5. Iniciar Servidor

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Ou modo produção
npm start
```

Você verá:
```
✅ Database connection established successfully
✅ Database synchronized
🚀 Server running on port 5000
📍 Environment: development
```

### 6. Testar API

Abra o navegador ou Postman e acesse:
```
http://localhost:5000/api/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "message": "TechStore API is running"
}
```

## Configuração de Email (Opcional)

Para enviar emails de verificação e recuperação de senha:

### Gmail:
1. Ative a verificação em 2 etapas
2. Gere uma "Senha de App"
3. Use essa senha no `.env`

### Outros provedores:
Configure `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER` e `EMAIL_PASSWORD` conforme seu provedor.

## Problemas Comuns

### Erro: "password authentication failed"
- Verifique se a senha do PostgreSQL está correta no `.env`
- Verifique se o usuário `postgres` existe

### Erro: "database does not exist"
- Crie o banco de dados: `CREATE DATABASE techstore;`

### Erro: "Port 5000 already in use"
- Mude a porta no `.env`: `PORT=5001`
- Ou encerre o processo usando a porta 5000

### Erro: "Cannot find module"
- Execute: `npm install`

## Próximos Passos

1. ✅ Backend rodando
2. Testar endpoints de autenticação
3. Conectar frontend ao backend
4. Implementar funcionalidades restantes

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Rodar em produção
npm start

# Ver logs do PostgreSQL (se necessário)
# Windows: Serviços > PostgreSQL
# Linux: sudo systemctl status postgresql
```

## Suporte

Se encontrar problemas:
1. Verifique os logs do servidor
2. Verifique se o PostgreSQL está rodando
3. Verifique as configurações do `.env`
4. Verifique se todas as dependências foram instaladas
