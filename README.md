# Isca CRM


## O que é o Isca CRM?

O Isca CRM é uma aplicação ``Next.js 15`` (App Router)  conectada a um banco ``Supabase``(PostgreSQL).
Ele expõe uma pequena API REST para:

🔑 Autenticação: ``registro``, ``login``, ``logout`` e ``/me``

🍽️ CRUD de itens do cardápio (``Prato``)

📅 Criação e gestão de reservas (``Reserva``), com notificação automática por e-mail


## Dependências principais & Runtime

- ``next`` (App Router), ``react``, ``react-dom``

- ``@supabase/supabase-js`` para acesso ao banco

- ``bcryptjs`` para hash de senhas

- ``prisma`` (para gerenciamento/geração do schema, mesmo que as queries em runtime usem Supabase)

- ``zod`` (disponível para validação; não é obrigatório nas rotas mostradas)

- ```nodemailer``` para envio de notificações por email

## Notas de build/runtime:

- TypeScript, ESLint e Tailwind configurados em ``devDependencies``.

O comando ``postinstall`` executa ``prisma generate``.


## Modelo de dados em alto nível (segundo o código)


### users
• id (UUID/texto) – gerado na criação
• name, email (único), password (hash), role ('USER' ou 'ADMIN')
• createdAt, updatedAt (timestamps ISO)

### sessions
• id (UUID)
• userId (FK para users.id)
• token (hex aleatório)
• ip, userAgent (opcional, cabeçalhos da requisição)
• createdAt, expiresAt (timestamps ISO)

### Prato
• id (texto ou UUID)
• nome, preco, descricao, descricao_en
• imagens (array de strings, opcional)
• isActive (booleano, default true)
• createdAt, updatedAt

### Reserva
• id
• nome, email, telefone
• quantity (número)
• data (datetime ISO da reserva)
• is_confirmed (booleano)
• message (texto opcional)
• createdAt, updatedAt

(Os tipos exatos podem variar conforme o schema.prisma / DDL, mas esses são os campos usados nas rotas.)


## Fluxo de autenticação (baseado em sessão)

- Nome do cookie: ```SESSION_COOKIE``` (HttpOnly, SameSite=Lax, Secure, path="/").

## Registro – POST /api/auth/register

- Valida nome, formato de email e presença de senha.

- Faz hash da senha (``bcrypt``) e cria usuário com role USER por padrão.

- Retorna o usuário criado (``id``, ``name``, ``email``, ``role``).

## Login – POST /api/auth/login

- Busca usuário pelo email normalizado (lowercase + trim).

- Verifica senha com ``bcrypt``.

- Gera ``id`` (UUID) e ``token`` (hex aleatório de 32 bytes).

- Salva a sessão (``id``, ``userId``, ``token``, ``ip``, ``userAgent``, ``createdAt``, ``expiresAt=+30d``).

- Define cookie HttpOnly com o token e retorna dados do usuário.

## Me – GET /api/auth/me

- Lê cookie de sessão e busca sessão correspondente.

- Valida ``expiresAt`` (deve ser válido e futuro).

- Carrega usuário associado.

- Retorna ``{ user }`` ou ``{ user: null }`` se falhar (sem token, sessão expirada, etc.).

## Logout – POST /api/auth/logout

- Lê cookie de sessão, deleta a linha da sessão pelo token.

- Expira cookie imediatamente (data epoch 0).

- Retorna ``{ ok: true }``.

- Helper de autorização:

- ``requireApiKeyOrAdmin()`` → permite acesso se o request tiver ``x-api-key`` válido OU se existir sessão válida de um usuário ADMIN.


## Middleware & Modelo de acesso

O arquivo ``middleware.ts`` define quais rotas exigem ``x-api-key`` e quais são públicas.


**PÚBLICAS**
• ``GET /api/pratos`` (listar pratos ativos)
• ``POST /api/reservas`` (criar reserva)

**PROTEGIDAS** (``x-api-key``)
• Outras rotas de ``/api/reservas``
• ``/api/pratos/[id]`` PUT e DELETE
• ``POST /api/pratos``
• Demais endpoints não explicitamente liberados


## Rotas & Comportamentos
### Auth

```POST /api/auth/register``` → cria usuário novo.

```POST /api/auth/login``` → autentica, cria sessão e cookie.

```POST /api/auth/logout``` → deleta sessão e expira cookie.

```GET /api/auth/me``` → retorna usuário da sessão ou null.

### Pratos

```GET /api/pratos``` (PÚBLICA) → retorna lista de pratos ativos.

``POST /api/pratos`` (PROTEGIDA) → insere prato (valida campos obrigatórios).

``GET /api/pratos/[id]`` (PÚBLICA) → retorna prato pelo id.

``PUT /api/pratos/[id]`` (PROTEGIDA) → atualiza parcialmente prato.

``DELETE /api/pratos/[id]`` (PROTEGIDA) → remove prato.

### Reservas

``POST /api/reservas`` (PÚBLICA) → cria reserva (valida data e campos) e envia email automático de notificação (via Gmail SMTP)

``GET /api/reservas`` (PROTEGIDA) → lista reservas (filtros: from, to, confirmed).

``GET /api/reservas/[id]`` (PROTEGIDA) → retorna reserva específica.

``PUT /api/reservas/[id]`` (PROTEGIDA) → atualiza reserva.

``DELETE /api/reservas/[id]`` (PROTEGIDA) → deleta reserva.


## Padrões de tratamento de erros

**JSON consistente: { error, detail?, cause? }**

``400`` → erro de validação (campos ausentes, email/data inválida)

``401`` → não autorizado (API key inválida ou sem permissão)

``404`` → registro não encontrado (Supabase retorna código PGRST116)

``500`` → erro de DB ou exceção não tratada



## Notificação por Email (Reservas)

- Sempre que uma reserva é criada, o sistema dispara um email automático contendo os dados da reserva.
- O envio é feito via ```nodemailer``` e SMTP do Gmail (com App Password).

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu.email@gmail.com
SMTP_PASS=sua_senha_de_app   # gerada em "App Passwords" do Google
RESERVA_NOTIFY_FROM="Isca <seu.email@gmail.com>"
RESERVA_NOTIFY_TO=seu.email@gmail.com
```

- No retorno da API, a chave ``notifications.email.ok`` indica se o envio foi bem-sucedido.


## Instruções de Migração

Para adicionar campo sem termos problema de drift entre Prisma e Supabase

### Passos

1. **Gerar a pasta de migração**
    - Use o script utilitário para criar uma pasta timestamped com um `migration.sql`:
    ```bash
    ./scripts/create_migration.sh nome-da-migracao
    ```

   - Isso criará algo como:

2. **Editar o arquivo migration.sql**
    ```sql
        ALTER TABLE "EXEMPLO" ADD COLUMN "LALALA" BOOLEAN NOT NULL DEFAULT false;
    ```

3. **Aplicar a migração no banco**
    ```bash
    npx prisma migrate deploy
    ```


## Notas de segurança

- Nunca logar ou retornar credenciais brutas (senha, API secret, service key).

- Manter cookie de sessão HttpOnly + Secure em produção.

- Garantir que o middleware só libere rotas públicas desejadas.

- Avaliar habilitar RLS no Supabase quando quiser endurecer políticas.