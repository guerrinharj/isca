-- AlterTable
ALTER TABLE "public"."Prato" ADD COLUMN     "is_alcoolico" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_drink" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_soft" BOOLEAN NOT NULL DEFAULT false;
