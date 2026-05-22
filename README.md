# Makse Profissional — E-commerce & Área Pro

Bem-vindo ao repositório da **Makse Profissional**, uma plataforma de e-commerce e sistema integrado voltado para profissionais de beleza e cosmética avançada. 

Este projeto foi desenvolvido e customizado por mim (**João Motta**) para entregar uma experiência digital premium, com foco em alta performance capilar e biotecnologia. A plataforma foi planejada para atender tanto o consumidor final quanto o profissional de salão (B2B), possuindo uma área administrativa robusta e fluxos otimizados.

---

## 💎 Visão Geral do Projeto

A **Makse Profissional** é uma marca de cosméticos de alta performance. O objetivo do projeto foi criar uma plataforma ágil, visualmente deslumbrante e que transmita sofisticação e profissionalismo desde o primeiro acesso.

### 🌟 Destaques de Design e UX
* **Aparência Luxury & Clean:** Uso refinado da paleta oficial (Slate Blue, Navy e tons de Cream), transições suaves e tipografia elegante para ressaltar a qualidade dos produtos.
* **Hero Section Imersiva:** Background imersivo e limpo, integrado perfeitamente ao cabeçalho com efeitos translúcidos e de scroll dinâmico.
* **Componentes Exclusivos B2B:** Página de cadastro especial para profissionais da beleza, validação de CNPJ e tabelas de desconto automáticas.
* **Totalmente Responsivo:** Layout rigorosamente adaptado para todas as resoluções (Mobile, Tablets, Notebooks e desktops grandes).

---

## 🛠️ Tecnologias Utilizadas

Para garantir a melhor escalabilidade, SEO e velocidade, escolhi uma stack moderna e robusta:

* **Framework:** [Next.js](https://nextjs.org/) (App Router, TypeScript e Server Components)
* **Banco de Dados & ORM:** PostgreSQL com [Prisma ORM](https://www.prisma.io/)
* **Estilização:** Vanilla CSS combinado com utilitários de TailwindCSS para controle granular e performance visual máxima.
* **Autenticação:** NextAuth.js
* **Efeitos Visuais:** Animações personalizadas e ScrollReveal para transições suaves de entrada.

---

## 🚀 Como Executar o Projeto Localmente

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
   Crie um arquivo `.env` ou `.env.local` na raiz com suas credenciais de banco de dados, NextAuth e integrações de pagamento/e-mail.

4. **Execute as migrações do banco de dados:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

6. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## ✒️ Desenvolvimento

Desenvolvido com dedicação por **João Motta** (joaolucass0607@gmail.com).

*Se tiver dúvidas ou quiser sugerir alguma melhoria no código, fique à vontade para abrir uma PR ou entrar em contato!*
