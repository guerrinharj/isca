/*
  Warnings:

  - Made the column `nome` on table `Prato` required. This step will fail if there are existing NULL values in that column.
  - Made the column `preco` on table `Prato` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nome` on table `Reserva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `data` on table `Reserva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `Reserva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telefone` on table `Reserva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `quantity` on table `Reserva` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Prato" ALTER COLUMN "nome" SET NOT NULL,
ALTER COLUMN "preco" SET NOT NULL,
ALTER COLUMN "promo_description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Reserva" ALTER COLUMN "nome" SET NOT NULL,
ALTER COLUMN "data" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "telefone" SET NOT NULL,
ALTER COLUMN "quantity" SET NOT NULL;
