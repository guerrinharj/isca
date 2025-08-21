/*
  Warnings:

  - Added the required column `promo_description` to the `Prato` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Prato" ADD COLUMN     "is_pintxo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_vegan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_vegetariano" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promo_description" TEXT NOT NULL,
ALTER COLUMN "nome" DROP NOT NULL,
ALTER COLUMN "preco" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Reserva" ALTER COLUMN "nome" DROP NOT NULL,
ALTER COLUMN "data" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "telefone" DROP NOT NULL,
ALTER COLUMN "quantity" DROP NOT NULL;
