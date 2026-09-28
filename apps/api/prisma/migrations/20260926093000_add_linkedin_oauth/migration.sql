ALTER TABLE "User" ADD COLUMN "linkedinSubject" TEXT;

CREATE UNIQUE INDEX "User_linkedinSubject_key" ON "User"("linkedinSubject");
