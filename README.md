# Isca

Este é um CRM (Customer Relationship Manager) feito em **Next.js** para **Isca Bar**. O objetivo é permitir a criação, visualização, edição e exclusão de reservas (`Reservas`), além de gerenciar Pratos (`Pratos`) e usuários da produtora.

---

## 📁 Estrutura do Projeto

- **Framework:** Next.js (App Router)
- **Banco de Dados:** Supabase (PostgreSQL gerenciado)
- **ORM de apoio:** Prisma (usado apenas como schema local)
- **Estilização:** TailwindCSS
- **Linguagem:** TypeScript
- **Deploy recomendado:** Vercel

---

## 🛠️ Supabase + Prisma

Apesar do Prisma estar configurado no projeto com o schema dos modelos (`schema.prisma`), **todas as operações de leitura, escrita e atualização no banco são feitas diretamente via Supabase** (REST API ou client SDK).

- Prisma serve como **referência local de schema** e ajuda no planejamento e geração de tipos.
- O Supabase é quem efetivamente **armazena os dados** e responde às requisições do app.

---

## 🚀 Instalação e Execução

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/isca.git
cd isca
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados**

Edite o arquivo .env e certifique-se de que ele contenha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<sua-instancia>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-chave-anon>
USERNAME=admin
PASSWORD=senha123
```


4. **Rode as migrações e gere o cliente Prisma inicial**
```bash
npx prisma migrate dev --name init
npx prisma generate
```


5. **Execute o servidor de desenvolvimento**
```bash
npm run dev
```