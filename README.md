# Scarface Artigos — Plataforma de Rifas

MVP de rifas online com área pública para compradores, painel administrativo e sorteio no servidor.

**Stack:** Next.js 15 App Router, TypeScript, Prisma 7, PostgreSQL/Supabase, Supabase Auth e Storage, Tailwind CSS 4, componentes shadcn/ui e Sonner.

## Funcionalidades

### Área pública

- Lista campanhas publicadas com imagem, preço e status.
- Exibe detalhes, progresso, regulamento e resultado do sorteio.
- Cadastro e login de compradores por Google ou e-mail/senha.
- Reserva números por tempo limitado, com expiração e cancelamento de pedidos pendentes.
- Após enviar o Pix, o comprador pode marcar “Já paguei” para manter os números reservados enquanto o pagamento aguarda confirmação manual.
- Permite que compradores autenticados consultem seus próprios pedidos em “Meus números”.
- Exibe chave Pix e contato de WhatsApp para pagamento manual.

### Painel administrativo

- Login administrativo protegido por sessão assinada.
- Cria campanhas e permite atualizar a imagem da campanha.
- Mostra pedidos e permite confirmar manualmente pagamentos.
- Destaca pedidos aguardando confirmação para o admin confirmar ou rejeitar/liberar.
- Permite publicar, encerrar e reabrir campanhas, respeitando as regras de campanha sorteada.
- Apresenta números pagos e pendentes, exportação CSV e sorteio com modo de apresentação.

## Arquitetura e decisões

- Regras sensíveis — reserva, confirmação, cancelamento, upload e sorteio — são executadas no servidor.
- Reservas criam pedidos `PENDING` e tickets; a expiração libera os números para novas compras.
- Cada comprador pode ter somente um pedido `PENDING` ativo por vez, mesmo entre campanhas; deve pagar, cancelar ou aguardar a expiração antes de reservar novamente. Pedidos `AWAITING_CONFIRMATION` não bloqueiam novas reservas e continuam limitados a dois por comprador.
- O pagamento é manual via Pix no MVP.
- Reservas `PENDING` continuam expirando em 30 minutos. Ao informar que já pagou, o pedido passa para `AWAITING_CONFIRMATION` e os números ficam reservados por até 12 horas para confirmação manual.
- Cada comprador pode ter no máximo dois pedidos ativos aguardando confirmação. O prazo é configurado por `VERIFICATION_WINDOW_HOURS` em `src/lib/tickets.ts`.
- Imagens são armazenadas no bucket público `campanhas` do Supabase Storage; o banco guarda a URL.
- `DATABASE_URL` é usada pela aplicação e `DIRECT_URL` pelo Prisma Migrate.
- O projeto usa bloqueio de linha da campanha para coordenar reservas, confirmações e sorteio.
- A criação de reservas também bloqueia a linha do perfil do comprador para serializar tentativas simultâneas e garantir o limite de um pedido pendente.

## Sorteio

1. Somente uma sessão administrativa válida pode iniciar o sorteio.
2. Participam tickets associados a pedidos pagos (`PAID`).
3. O servidor seleciona um ticket com `crypto.randomInt`; cada ticket pago tem chance igual.
4. Resultado e encerramento da campanha são gravados na mesma transação, com proteção contra execução dupla.
5. Campanhas sorteadas não podem ser reabertas e novas reservas são bloqueadas.

## Segurança

- Server Actions e rotas administrativas verificam a sessão no servidor.
- `SUPABASE_SERVICE_ROLE_KEY` é usada apenas no servidor para uploads no Storage.
- Upload valida MIME e tamanho (JPG, PNG e WebP, até 5 MB) no cliente e servidor.
- `.env`, diretórios gerados, backups e arquivos ZIP são ignorados pelo Git.
- Scripts de banco exigem `ALLOW_DB_SCRIPTS=true`, recusam `NODE_ENV=production` e comparam `DATABASE_URL` com `PRODUCTION_DB_HOST`.
- Use bancos de desenvolvimento e produção separados. Nunca rode scripts de teste contra a produção.

## Estrutura

```text
prisma/              Schema e migrations
scripts/             Proteção e teste de concorrência
src/app/             Rotas públicas, autenticação e painel admin
src/components/      Componentes de interface compartilhados
src/lib/             Prisma, Supabase e regras de negócio
public/assets/       Logo e imagens estáticas incluídas no projeto
```

## Configuração local

### Pré-requisitos

- Node.js 20 ou superior
- Projeto Supabase para desenvolvimento
- Bucket público `campanhas` criado no Supabase Storage

### Instalação

```bash
git clone https://github.com/guedescss/scarfacerifas.git
cd scarfacerifas
npm install
```

Copie `.env.example` para `.env` e substitua os valores de exemplo por credenciais do seu ambiente. Não compartilhe nem versione `.env`.

```bash
npx prisma migrate deploy
npm run dev
```

Abra `http://localhost:3000`. Acesse o painel em `/admin`.

Configure Google OAuth no Supabase Auth. Para desenvolvimento, adicione a URL local às origens e aos redirects permitidos do Supabase e do provedor Google.

## Variáveis de ambiente

O arquivo [.env.example](./.env.example) lista as variáveis reconhecidas pelo projeto, com valores fictícios:

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL da aplicação |
| `DIRECT_URL` | Conexão usada pelo Prisma Migrate |
| `ADMIN_PASSWORD` | Senha do painel administrativo |
| `ADMIN_SECRET` | Segredo de assinatura da sessão do admin |
| `PIX_KEY` | Chave Pix exibida ao comprador |
| `WHATSAPP` | Contato de WhatsApp no servidor |
| `NEXT_PUBLIC_WHATSAPP` | Contato de WhatsApp usado no navegador |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável do Supabase Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta, exclusiva do servidor, usada no Storage |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site |
| `ALLOW_DB_SCRIPTS` | Liberação explícita para scripts locais de banco |
| `PRODUCTION_DB_HOST` | Host de produção usado pela trava dos scripts |

Variáveis `NEXT_PUBLIC_*` ficam disponíveis no navegador. Nunca coloque senhas ou chaves secretas sob esse prefixo.

## Migrations, seed e teste de concorrência

O Prisma 7 lê a URL de migrations em `prisma.config.ts`. Para aplicar migrations pendentes:

```bash
npx prisma migrate deploy
```

Não use `prisma migrate reset` nem `db push --force-reset` em produção. Faça backup antes de operações de banco importantes.

Teste migrations com `DATABASE_URL` e `DIRECT_URL` de um banco de desenvolvimento separado; nunca execute `prisma migrate dev` contra produção. A migration `20261025043400_awaiting_payment_confirmation` adiciona o estado de confirmação e seus prazos sem resetar nem apagar dados existentes.

O seed e o teste de concorrência requerem liberação explícita e uma conexão de desenvolvimento:

```powershell
$env:ALLOW_DB_SCRIPTS = "true"
$env:PRODUCTION_DB_HOST = "host-exato-do-banco-de-producao"
npx tsx prisma/seed.ts
npx tsx scripts/test-concurrency.ts
```

Os scripts recusam execução com `NODE_ENV=production` e bloqueiam quando `DATABASE_URL` usa o host configurado como produção. O seed só cria a campanha de teste se ela não existir; o teste de concorrência remove apenas pedidos/perfis que ele próprio cria.

## Deploy na Vercel

1. Importe `https://github.com/guedescss/scarfacerifas` na Vercel.
2. Configure as variáveis de ambiente de produção — e Preview, se necessário — em **Settings → Environment Variables**.
3. Use credenciais de produção para o banco e configure `NEXT_PUBLIC_SITE_URL` com a URL final.
4. A Vercel executa `prisma generate` no build (`npm run build`).
5. Aplique migrations pendentes com `npx prisma migrate deploy` usando a `DIRECT_URL` de produção.
6. Configure origens e redirects de produção no Supabase Auth e no provedor Google OAuth.

As migrations não criam campanhas. Se o banco estiver vazio, crie a campanha pelo painel admin.

## Backups

As migrations versionam a estrutura, não os dados. Faça backups do banco antes de migrations, sorteios e operações importantes. Armazene-os fora do repositório e confira que podem ser restaurados em um ambiente de teste. Pedidos de confirmação que ultrapassarem as 12 horas deixam de ocupar números e são removidos junto dos pedidos expirados na próxima reserva da campanha.

## Próximos passos

- Integração com gateway e confirmação Pix por webhook.
- Notificações automáticas.
- Relatórios e métricas administrativas.

> Antes de realizar rifas comerciais, consulte a legislação aplicável e os requisitos de autorização.
