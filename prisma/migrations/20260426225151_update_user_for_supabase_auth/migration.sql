/*
  Warnings:

  - You are about to drop the column `cefrLevel` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "cefrLevel",
DROP COLUMN "passwordHash",
ADD COLUMN     "level" "CefrLevel",
ADD COLUMN     "targetSkill" "SkillType";
