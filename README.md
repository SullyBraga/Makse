# Makse Profissional — E-commerce & Área B2B

Este é o repositório da plataforma **Makse Profissional**, um e-commerce completo e sistema integrado sob medida desenvolvido para profissionais de beleza e cosméticos de alta performance.

Desenvolvi este projeto do zero para atender a uma necessidade real do mercado: unificar a venda direta ao consumidor final (B2C) com um fluxo exclusivo, robusto e seguro para salões de beleza e cabeleireiros parceiros (B2B). O resultado é uma aplicação rápida, visualmente elegante e com uma área administrativa completa para gestão de estoque, pedidos, usuários e tabelas de desconto dinâmicas.

---

## 🚀 O Projeto

A **Makse Profissional** é uma marca focada em biotecnologia e alta performance capilar. Para refletir essa identidade premium no digital, criei uma interface moderna baseada em uma paleta de cores sóbrias (Slate Blue, Navy e tons Cream), com efeitos visuais fluidos, cabeçalho dinâmico e carregamento instantâneo.

### Principais Funcionalidades Implementadas:

* **Experiência Híbrida (B2C + B2B):** Fluxos de navegação e preços adaptados para clientes comuns e profissionais da área da beleza.
* **Cadastro e Validação de Profissionais:** Formulário dedicado com coleta e validação de dados (como CNPJ e informações profissionais) que passam por um fluxo de aprovação manual no painel admin.
* **Tabelas de Desconto Dinâmicas:** O administrador consegue criar tabelas de desconto exclusivas para grupos de profissionais, aplicando a redução de preços de forma automática em todo o catálogo.
* **Painel Administrativo Completo:** Área restrita para gerenciamento de produtos (com suporte a variantes, fotos e estoque mínimo), pedidos realizados, aprovação de novos profissionais e cadastro de vendedores.
* **Design Responsivo & Adaptável:** Interface refinada e testada exaustivamente para oferecer uma navegação perfeita desde smartphones até telas de notebooks e desktops.

---

## 🛠️ Tecnologias e Arquitetura

Optei por uma stack moderna e focada em escalabilidade e facilidade de deploy:

* **Next.js (App Router):** Utilização de React Server Components (RSC) para otimização de performance e SEO, e Route Handlers para endpoints de API.
* **TypeScript:** Tipagem estática em toda a aplicação para garantir a segurança no desenvolvimento e manutenção do código.
* **Prisma ORM & PostgreSQL:** Modelagem eficiente das tabelas de usuários, produtos, variantes, pedidos e solicitações de aprovação profissional.
* **NextAuth.js:** Controle de autenticação seguro, gerenciando cookies e sessões com diferentes níveis de acesso (*CLIENTE_FINAL*, *CABELEIREIRA*, *ADMIN*, *PENDENTE*).
* **Tailwind CSS & Vanilla CSS:** Estilização limpa, de alta performance e totalmente adaptada às necessidades do design.

---

## ⚙️ Configuração e Execução Local

Caso queira rodar o projeto localmente para testes ou desenvolvimento:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SullyBraga/Makse.git
   cd Makse
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto com base no seguinte modelo:
   ```env
   # Banco de Dados (PostgreSQL)
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/makse_db"

   # NextAuth (Gere uma chave segura usando: openssl rand -base64 32)
   NEXTAUTH_SECRET="sua_chave_secreta_aqui"
   NEXTAUTH_URL="http://localhost:3000"

   # Stripe (Modo de Teste)
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."

   # Resend (Envio de E-mails)
   RESEND_API_KEY="re_..."
   EMAIL_FROM="contato@makseprofissional.com.br"
   ```

4. **Prepare o banco de dados (Prisma):**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

6. Acesse a aplicação em [http://localhost:3000](http://localhost:3000).

---

## 👨‍💻 Autor

Desenvolvido por **João Motta**.

* Caso queira trocar uma ideia sobre o projeto, sugerir melhorias ou colaborar com novas features, sinta-se à vontade para abrir uma issue, enviar um Pull Request ou entrar em contato!
* 📧 E-mail: [joaolucass0607@gmail.com](mailto:joaolucass0607@gmail.com)
