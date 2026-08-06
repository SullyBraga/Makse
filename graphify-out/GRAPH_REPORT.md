# Graph Report - Makse-main  (2026-08-06)

## Corpus Check
- 117 files · ~593,791 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 480 nodes · 579 edges · 60 communities (42 shown, 18 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7ffd4fa2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useCartStore
- 🖥️ <a id="servidor-dedicado"></a> 3. Deploy em Servidor Dedicado Node.js
- dependencies
- devDependencies
- KitForm.tsx
- compilerOptions
- auth.ts
- route.ts
- prisma.ts
- UserActions.tsx
- shipping.ts
- CatalogoClient.tsx
- route.ts
- layout.tsx
- page.tsx
- page.tsx
- route.ts
- Makse Pro
- route.ts
- check_weights.js
- page.tsx
- page.tsx
- bling.ts
- route.ts
- route.ts
- page.tsx
- page.tsx
- email.ts
- seed.ts
- check_images.js
- check_remote_user.js
- page.tsx
- page.tsx
- route.ts
- page.tsx
- page.tsx
- app.js
- inspect_products.ts
- page.tsx
- page.tsx
- page.tsx
- route.ts
- route.ts
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- check_hash.js
- { GET, POST }

## God Nodes (most connected - your core abstractions)
1. `useCartStore` - 17 edges
2. `compilerOptions` - 16 edges
3. `🖥️ <a id="servidor-dedicado"></a> 3. Deploy em Servidor Dedicado Node.js` - 10 edges
4. `🚀 Configuração Completa - Makse Ecommerce` - 9 edges
5. `xlsx` - 7 edges
6. `compressImage()` - 7 edges
7. `POST()` - 6 edges
8. `POST()` - 6 edges
9. `🔧 <a id="local"></a> 1. Configuração Local para Testes` - 6 edges
10. `🌍 <a id="vercel-supabase"></a> 2. Deploy no Vercel + Supabase (Testes em Produção)` - 6 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --references--> `xlsx`  [EXTRACTED]
  src/app/api/admin/kits/export/route.ts → package.json
- `GET()` --references--> `xlsx`  [EXTRACTED]
  src/app/api/admin/products/export/route.ts → package.json
- `SmoothScroll()` --references--> `lenis`  [EXTRACTED]
  src/components/SmoothScroll.tsx → package.json
- `GET()` --references--> `xlsx`  [EXTRACTED]
  src/app/api/admin/kits/import/route.ts → package.json
- `POST()` --references--> `xlsx`  [EXTRACTED]
  src/app/api/admin/kits/import/route.ts → package.json

## Import Cycles
- None detected.

## Communities (60 total, 18 thin omitted)

### Community 0 - "useCartStore"
Cohesion: 0.07
Nodes (25): Address, CheckoutPage(), ShippingOption, KitData, KitItem, KitPageClient(), CartDrawer(), Header() (+17 more)

### Community 1 - "🖥️ <a id="servidor-dedicado"></a> 3. Deploy em Servidor Dedicado Node.js"
Cohesion: 0.06
Nodes (32): 1.1 Clonar e Instalar, 1.2 Configurar Banco de Dados Local, 1.3 Setup do Banco de Dados, 1.4 Executar Localmente, 2.1 Preparar o Repositório, 2.2 Configurar Supabase (PostgreSQL Gerenciado), 2.3 Setup Inicial no Supabase, 2.4 Conectar no Vercel (+24 more)

### Community 2 - "dependencies"
Cohesion: 0.07
Nodes (25): dependencies, bcryptjs, framer-motion, http-proxy, lenis, lucide-react, mercadopago, next (+17 more)

### Community 3 - "devDependencies"
Cohesion: 0.09
Nodes (21): devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss, tsx, @types/node (+13 more)

### Community 4 - "KitForm.tsx"
Cohesion: 0.08
Nodes (16): KitFormEdit(), Props, KitComponent, KitForm(), Product, Props, COLUMNS, ImportarProdutosPage() (+8 more)

### Community 5 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 6 - "auth.ts"
Cohesion: 0.12
Nodes (3): { handlers, auth, signIn, signOut }, config, proxy

### Community 7 - "route.ts"
Cohesion: 0.15
Nodes (17): xlsx, GET(), GET(), parseBool(), parsePrice(), POST(), requireAdmin(), toSlug() (+9 more)

### Community 9 - "UserActions.tsx"
Cohesion: 0.13
Nodes (11): DiscountTable, roleConfig, User, DiscountTable, Props, DiscountTable, Props, ROLE_OPTIONS (+3 more)

### Community 10 - "shipping.ts"
Cohesion: 0.16
Nodes (9): PATCH(), requireAdmin(), GET(), POST(), requireSeller(), POST(), POST(), TODO: Chamar API do Bling para baixa no estoque (+1 more)

### Community 11 - "CatalogoClient.tsx"
Cohesion: 0.13
Nodes (7): Item, Line, Props, HomePage(), S, SLIDES, Props

### Community 12 - "route.ts"
Cohesion: 0.36
Nodes (9): DELETE(), POST(), requireAdmin(), DELETE(), PATCH(), POST(), requireAdmin(), deleteUploadedFile() (+1 more)

### Community 14 - "layout.tsx"
Cohesion: 0.28
Nodes (3): nav, AdminMobileToggle(), AdminSignOut()

### Community 15 - "page.tsx"
Cohesion: 0.25
Nodes (4): paymentLabel, statusConfig, Props, STATUS_OPTIONS

### Community 16 - "page.tsx"
Cohesion: 0.25
Nodes (6): CartItem, Kit, PAYMENTS, Product, UserResult, Variant

### Community 17 - "route.ts"
Cohesion: 0.46
Nodes (7): DELETE(), GET(), PATCH(), POST(), requireAdmin(), requireAdminOrSeller(), toSlug()

### Community 18 - "Makse Pro"
Cohesion: 0.29
Nodes (6): 👨‍💻 Autor, ⚙️ Configuração e Execução Local, Makse Pro, 🚀 O Projeto, Principais Funcionalidades Implementadas:, 🛠️ Tecnologias e Arquitetura

### Community 19 - "route.ts"
Cohesion: 0.52
Nodes (5): DELETE(), PATCH(), POST(), requireAdmin(), toSlug()

### Community 20 - "check_weights.js"
Cohesion: 0.40
Nodes (5): { loadEnvConfig }, main(), parseProductWeight(), prisma, { PrismaClient }

### Community 21 - "page.tsx"
Cohesion: 0.47
Nodes (4): C, ParaProfissionaisPage(), sec(), ProfessionalForm()

### Community 22 - "page.tsx"
Cohesion: 0.33
Nodes (4): CartItem, PAYMENT_METHODS, Product, UserResult

### Community 23 - "bling.ts"
Cohesion: 0.60
Nodes (5): blingRequest(), decrementBlingStock(), getBlingStock(), processSaleStock(), syncAllStock()

### Community 24 - "route.ts"
Cohesion: 0.70
Nodes (4): DELETE(), GET(), POST(), requireAdmin()

### Community 25 - "route.ts"
Cohesion: 0.70
Nodes (4): DELETE(), GET(), POST(), requireAdmin()

### Community 26 - "page.tsx"
Cohesion: 0.40
Nodes (3): AccountType, labelStyle, sectionLabelStyle

### Community 27 - "page.tsx"
Cohesion: 0.40
Nodes (3): roleLabel, statusColors, UserData

### Community 28 - "email.ts"
Cohesion: 0.46
Nodes (6): POST(), sendEmail(), sendOrderConfirmationEmail(), sendPasswordResetEmail(), sendProfessionalApprovalEmail(), sendStatusUpdateEmail()

### Community 33 - "page.tsx"
Cohesion: 0.67
Nodes (3): AdminDashboard(), getStats(), statusBadge

### Community 34 - "route.ts"
Cohesion: 0.83
Nodes (3): DELETE(), PATCH(), requireAdmin()

### Community 37 - "page.tsx"
Cohesion: 0.67
Nodes (3): C, sec(), SobrePage()

## Knowledge Gaps
- **179 isolated node(s):** `path`, `dir`, `eslintConfig`, `nextConfig`, `name` (+174 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `route.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `prisma` connect `devDependencies` to `prisma.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `path`, `dir`, `eslintConfig` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useCartStore` be split into smaller, more focused modules?**
  _Cohesion score 0.07084785133565621 - nodes in this community are weakly interconnected._
- **Should `🖥️ <a id="servidor-dedicado"></a> 3. Deploy em Servidor Dedicado Node.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07389162561576355 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._