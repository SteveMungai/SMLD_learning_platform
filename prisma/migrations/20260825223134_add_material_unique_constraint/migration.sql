/*
  Warnings:

  - A unique constraint covering the columns `[weekId,type,title]` on the table `Material` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Material_weekId_type_title_key" ON "Material"("weekId", "type", "title");
