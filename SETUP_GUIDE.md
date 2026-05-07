# 🚀 Configuração Completa - Makse Ecommerce

Este guia cobre tudo que você precisa para colocar o ecommerce funcionando em cada ambiente.

## 📋 Índice
1. [Configuração Local (Testes)](#local)
2. [Deploy no Vercel + Supabase](#vercel-supabase)
3. [Deploy em Servidor Dedicado Node.js](#servidor-dedicado)

---

## 🔧 <a id="local"></a> 1. Configuração Local para Testes

### Pré-requisitos
- Node.js 18+
- PostgreSQL instalado localmente
- Git

### 1.1 Clonar e Instalar

```bash
# Clone o repositório
git clone <seu-repo> makse
cd makse

# Instale as dependências
npm install

# Gere a chave NextAuth (use uma ferramenta online como openssl)
openssl rand -base64 32
# Salve a saída para usar depois
```

### 1.2 Configurar Banco de Dados Local

```bash
# Crie um banco PostgreSQL
createdb makse_db

# Abra .env.local e configure:
```

Crie o arquivo `.env.local` na raiz:

```env
# Banco de dados PostgreSQL (local)
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/makse_db"

# NextAuth
NEXTAUTH_SECRET="cole-aqui-a-chave-gerada"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (use modo teste por enquanto)
STRIPE_SECRET_KEY="sk_test_..."  # De https://dashboard.stripe.com/test/apikeys
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_test_..."  # Será gerado depois

# Bling ERP (opcional por enquanto)
BLING_API_KEY="sua-chave-bling-ou-deixe-vazio"

# Email (Resend - https://resend.com)
RESEND_API_KEY="re_..."
EMAIL_FROM="contato@makseprofissional.com.br"
```

### 1.3 Setup do Banco de Dados

```bash
# Aplique as migrações Prisma
npx prisma migrate dev --name init

# Isso vai criar todas as tabelas automaticamente
# Prisma também vai gerar o Prisma Client
```

### 1.4 Executar Localmente

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

---

## 🌍 <a id="vercel-supabase"></a> 2. Deploy no Vercel + Supabase (Testes em Produção)

### 2.1 Preparar o Repositório

```bash
# Certifique-se que tudo está commitado
git add .
git commit -m "Setup inicial para deploy"
git push origin main
```

### 2.2 Configurar Supabase (PostgreSQL Gerenciado)

1. Vá para [supabase.com](https://supabase.com)
2. Crie uma nova **Organização** e **Projeto**
3. Na aba **Settings → Database**, copie a **Connection String** (escolha o formato URI)
4. Copie exatamente assim: `postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]`

### 2.3 Setup Inicial no Supabase

```bash
# Localmente, aponte para Supabase temporariamente:
export DATABASE_URL="postgresql://[sua-conexao-supabase]"

# Execute as migrações
npx prisma migrate deploy

# Depois volte ao banco local
```

### 2.4 Conectar no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **New Project**
3. Importe seu repositório GitHub
4. Vercel vai detectar que é Next.js automaticamente
5. Em **Environment Variables**, adicione:

```
DATABASE_URL = <sua-url-supabase>
NEXTAUTH_SECRET = <chave-gerada-antes>
NEXTAUTH_URL = https://seu-dominio-vercel.vercel.app

# Stripe
STRIPE_SECRET_KEY = sk_test_...
STRIPE_PUBLISHABLE_KEY = pk_test_...
STRIPE_WEBHOOK_SECRET = whsec_test_...

# Email
RESEND_API_KEY = re_...
EMAIL_FROM = contato@makseprofissional.com.br

# Bling
BLING_API_KEY = sua-chave-ou-deixe-vazio
```

6. Clique em **Deploy**

### 2.5 Webhooks do Stripe no Vercel

Depois que o deploy terminar:

1. Vá para [stripe.com/webhooks](https://dashboard.stripe.com/test/webhooks)
2. Clique em **Add endpoint**
3. URL do endpoint: `https://seu-dominio-vercel.vercel.app/api/webhooks/stripe`
4. Selecione eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
5. Copie o **Signing Secret** (começa com `whsec_`)
6. Volte ao Vercel e atualize a variável `STRIPE_WEBHOOK_SECRET`

---

## 🖥️ <a id="servidor-dedicado"></a> 3. Deploy em Servidor Dedicado Node.js

### 3.1 Preparação do Servidor

**No seu servidor** (Ubuntu 22.04 como exemplo):

```bash
# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instale PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instale PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instale Nginx (reverse proxy)
sudo apt install -y nginx

# Instale Git
sudo apt install -y git
```

### 3.2 Criar Banco de Dados no Servidor

```bash
# Connect ao PostgreSQL
sudo -u postgres psql

# Dentro do psql:
CREATE USER makse_user WITH PASSWORD 'senha-super-segura-aqui';
CREATE DATABASE makse_prod OWNER makse_user;
GRANT ALL PRIVILEGES ON DATABASE makse_prod TO makse_user;
\q
```

### 3.3 Clonar a Aplicação

```bash
# Crie uma pasta para a app
sudo mkdir -p /var/www/makse
sudo chown $USER:$USER /var/www/makse

cd /var/www/makse

# Clone o repositório
git clone <seu-repo> .

# Instale dependências
npm install

# Build para produção
npm run build
```

### 3.4 Configurar Variáveis de Ambiente

```bash
sudo nano .env.production
```

Adicione:

```env
DATABASE_URL="postgresql://makse_user:senha-aqui@localhost:5432/makse_prod"
NEXTAUTH_SECRET="gere-uma-nova-chave-segura"
NEXTAUTH_URL="https://seu-dominio.com.br"

STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_live_..."

RESEND_API_KEY="re_..."
EMAIL_FROM="contato@makseprofissional.com.br"

BLING_API_KEY="sua-chave-bling"

# Importante para Next.js em servidor:
NODE_ENV="production"
```

Salve com `Ctrl+X`, depois `Y`, depois `Enter`.

### 3.5 Executar Migrações

```bash
npx prisma migrate deploy
```

### 3.6 Iniciar com PM2

```bash
# Inicie a aplicação
pm2 start npm --name "makse" -- start

# Configure para iniciar automaticamente
pm2 startup
pm2 save
```

### 3.7 Configurar Nginx (Reverse Proxy)

Crie `/etc/nginx/sites-available/makse`:

```bash
sudo nano /etc/nginx/sites-available/makse
```

Adicione:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    # Redireciona HTTP para HTTPS (depois que tiver SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    # Certificado SSL (veja seção SSL abaixo)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative o site:

```bash
sudo ln -s /etc/nginx/sites-available/makse /etc/nginx/sites-enabled/
sudo nginx -t  # Testa a configuração
sudo systemctl restart nginx
```

### 3.8 Configurar SSL com Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br
```

### 3.9 Webhooks do Stripe no Servidor

Mesmo processo do Vercel, mas a URL será:
`https://seu-dominio.com.br/api/webhooks/stripe`

---

## 📚 Arquitetura Atual da Aplicação

### Sistema de Login
- **Autenticação**: NextAuth + Credentials (email/senha)
- **Senha**: Armazenada com hash bcrypt
- **Sessão**: JWT Token
- **Roles**: CLIENTE_FINAL, CABELEIREIRA, ADMIN, PENDENTE

### Banco de Dados
```
Users (clientes, profissionais, admin)
Products (com variantes e estoque)
Orders (pedidos com status)
Addresses (endereços dos clientes)
ProfessionalRequests (solicitações de cadastro)
DiscountTables (desconto customizado por grupo)
```

### APIs Implementadas
- `GET/POST /api/products` - Listagem e criação
- `GET/POST /api/admin/users` - Gerenciar usuários
- `GET/POST /api/admin/orders` - Gerenciar pedidos
- `POST /api/checkout` - Criar sessão Stripe
- `POST /api/professional` - Solicitar acesso profissional
- `POST /api/webhooks/stripe` - Atualizar status de pagamento

### Painel Admin
- Localizado em `/admin` (apenas ADMIN role)
- Abas: Usuários, Pedidos, Produtos, Estoque

---

## ✅ Checklist de Funcionamento

Para cada ambiente, verifique:

- [ ] Login funciona (crie um usuário em `/cadastro`)
- [ ] Adiciona produto ao carrinho
- [ ] Checkout redireciona ao Stripe (modo teste)
- [ ] Painel `/admin` acessível apenas com ROLE = ADMIN
- [ ] Para-profissionais `/para-profissionais` funciona
- [ ] Email de confirmação é enviado (cheque Resend)
- [ ] Webhook do Stripe atualiza status do pedido

---

## 🔐 Segurança Importante

- [ ] Use HTTPS em produção (Let's Encrypt)
- [ ] Nunca comite `.env.production` no Git
- [ ] Mantenha `NEXTAUTH_SECRET` gerado e seguro
- [ ] Rotate `STRIPE_WEBHOOK_SECRET` regularmente
- [ ] Monitore logs do PM2: `pm2 logs makse`
- [ ] Faça backup regular do banco Supabase/PostgreSQL

---

## 🐛 Troubleshooting

**Erro de conexão ao banco:**
```bash
# Teste a conexão
npx prisma db push
```

**Webhook do Stripe não funciona:**
- Verifique se a URL é acessível: `curl https://seu-dominio/api/webhooks/stripe`
- Procure por erros em `pm2 logs makse`

**NextAuth não funciona:**
- Certifique-se que `NEXTAUTH_URL` bate com seu domínio
- Verifique se `NEXTAUTH_SECRET` está definido

**Build falha no Vercel:**
- Rode `npm run build` localmente para reproduzir
- Verifique se todas as variáveis de ambiente estão no Vercel

---

**Precisa de ajuda? Pergunte!** 🚀
