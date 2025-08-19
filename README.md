Isca CRM – Visão Técnica

Última atualização: 2025-08-19 16:02:43

============================================================

1) O que é o Isca CRM (visão geral)

O Isca CRM é uma aplicação Next.js 15 (App Router) conectada a um banco de dados Supabase (PostgreSQL).
Ele expõe uma pequena API no estilo REST para:

Autenticação (registro/login/logout/me) com sessões gerenciadas no servidor

CRUD de itens do cardápio (“Prato”)

Criação de reservas (“Reserva”) e consultas administrativas

O acesso aos dados é feito via cliente oficial do Supabase em JavaScript.
As senhas são criptografadas no servidor.
As sessões são armazenadas em uma tabela sessions e um cookie HttpOnly é usado no cliente para autenticação.

============================================================

2) Dependências principais & Runtime

next (App Router), react, react-dom

@supabase/supabase-js para acesso ao banco

bcryptjs para hash de senhas

prisma (para gerenciamento/geração do schema, mesmo que as queries em runtime usem Supabase)

zod (disponível para validação; não é obrigatório nas rotas mostradas)

Notas de build/runtime:

TypeScript, ESLint e Tailwind configurados em devDependencies.

O comando postinstall executa prisma generate.

============================================================

3) Modelo de dados em alto nível (segundo o código)

Tabelas referenciadas nas rotas:

users
• id (UUID/texto) – gerado na criação
• name, email (único), password (hash), role ('USER' ou 'ADMIN')
• createdAt, updatedAt (timestamps ISO)

sessions
• id (UUID)
• userId (FK para users.id)
• token (hex aleatório)
• ip, userAgent (opcional, cabeçalhos da requisição)
• createdAt, expiresAt (timestamps ISO)

Prato
• id (texto ou UUID)
• nome, preco, descricao, descricao_en
• imagens (array de strings, opcional)
• isActive (booleano, default true)
• createdAt, updatedAt

Reserva
• id
• nome, email, telefone
• quantity (número)
• data (datetime ISO da reserva)
• is_confirmed (booleano)
• message (texto opcional)
• createdAt, updatedAt

(Os tipos exatos podem variar conforme o schema.prisma / DDL, mas esses são os campos usados nas rotas.)

============================================================

4) Fluxo de autenticação (baseado em sessão)

Nome do cookie: SESSION_COOKIE (HttpOnly, SameSite=Lax, Secure, path="/").

4.1) Registro – POST /api/auth/register

Valida nome, formato de email e presença de senha.

Faz hash da senha (bcrypt) e cria usuário com role USER por padrão.

Retorna o usuário criado (id, name, email, role).

4.2) Login – POST /api/auth/login

Busca usuário pelo email normalizado (lowercase + trim).

Verifica senha com bcrypt.

Gera id (UUID) e token (hex aleatório de 32 bytes).

Salva a sessão (id, userId, token, ip, userAgent, createdAt, expiresAt=+30d).

Define cookie HttpOnly com o token e retorna dados do usuário.

4.3) Me – GET /api/auth/me

Lê cookie de sessão e busca sessão correspondente.

Valida expiresAt (deve ser válido e futuro).

Carrega usuário associado.

Retorna { user } ou { user: null } se falhar (sem token, sessão expirada, etc.).

4.4) Logout – POST /api/auth/logout

Lê cookie de sessão, deleta a linha da sessão pelo token.

Expira cookie imediatamente (data epoch 0).

Retorna { ok: true }.

Helper de autorização:

requireApiKeyOrAdmin() → permite acesso se o request tiver x-api-key válido OU se existir sessão válida de um usuário ADMIN.

============================================================

5) Middleware & Modelo de acesso

O arquivo middleware.ts define quais rotas exigem x-api-key e quais são públicas.

Atualmente:

PÚBLICAS
• GET /api/pratos (listar pratos ativos)
• POST /api/reservas (criar reserva)

PROTEGIDAS (x-api-key OU sessão ADMIN)
• Outras rotas de /api/reservas (GET listagem, GET/PUT/DELETE por id)
• /api/pratos/[id] PUT e DELETE (e possivelmente POST /api/pratos)
• Demais endpoints não explicitamente liberados

============================================================

6) Rotas & Comportamentos
6.1) Auth

POST /api/auth/register → cria usuário novo.

POST /api/auth/login → autentica, cria sessão e cookie.

POST /api/auth/logout → deleta sessão e expira cookie.

GET /api/auth/me → retorna usuário da sessão ou null.

6.2) Pratos

GET /api/pratos (PÚBLICA) → retorna lista de pratos ativos.

POST /api/pratos (PROTEGIDA) → insere prato (valida campos obrigatórios).

GET /api/pratos/[id] (PÚBLICA) → retorna prato pelo id.

PUT /api/pratos/[id] (PROTEGIDA) → atualiza parcialmente prato.

DELETE /api/pratos/[id] (PROTEGIDA) → remove prato.

6.3) Reservas

POST /api/reservas (PÚBLICA) → cria reserva (valida data e campos).

GET /api/reservas (PROTEGIDA) → lista reservas (filtros: from, to, confirmed).

GET /api/reservas/[id] (PROTEGIDA) → retorna reserva específica.

PUT /api/reservas/[id] (PROTEGIDA) → atualiza reserva.

DELETE /api/reservas/[id] (PROTEGIDA) → deleta reserva.

============================================================

7) Padrões de tratamento de erros

JSON consistente: { error, detail?, cause? }

400 → erro de validação (campos ausentes, email/data inválida)

401 → não autorizado (API key inválida ou sem permissão)

404 → registro não encontrado (Supabase retorna código PGRST116)

500 → erro de DB ou exceção não tratada

============================================================

8) Notas de segurança

Nunca logar ou retornar credenciais brutas (senha, API secret, service key).

Manter cookie de sessão HttpOnly + Secure em produção.

Garantir que o middleware só libere rotas públicas desejadas.

Avaliar habilitar RLS no Supabase quando quiser endurecer políticas.

============================================================

9) Modelo mental rápido

Público: GET /api/pratos, POST /api/reservas

Protegido (Admin/API-key): resto das rotas de pratos e reservas

Sessões: linha no DB + cookie HttpOnly

me lê cookie → busca usuário

logout deleta linha e expira cookie

Esse é o núcleo do Isca CRM conforme implementado no código fornecido.