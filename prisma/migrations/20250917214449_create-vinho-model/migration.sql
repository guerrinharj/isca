-- Migration: add-model-vinho

-- 1) Enum para tipo de vinho
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoVinho') THEN
        CREATE TYPE "TipoVinho" AS ENUM ('Bolhas', 'Branco', 'Laranja', 'Rosé', 'Tinto');
    END IF;
END $$;

-- 2) Tabela Vinho
CREATE TABLE IF NOT EXISTS "Vinho" (
    "id" TEXT PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" "TipoVinho" NOT NULL,
    "ano" TEXT,
    "quantidade" TEXT,
    "descricao" TEXT,
    "descricao_en" TEXT,
    "preco_grf" TEXT,
    "preco_125ml" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
