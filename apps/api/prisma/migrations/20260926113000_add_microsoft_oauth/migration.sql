ALTER TABLE "User" ADD COLUMN "microsoftSubject" TEXT;
CREATE UNIQUE INDEX "User_microsoftSubject_key" ON "User"("microsoftSubject");
