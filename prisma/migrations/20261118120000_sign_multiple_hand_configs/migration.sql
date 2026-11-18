-- Sinal passa a ter várias configurações de mão (many-to-many implícita)

-- CreateTable
CREATE TABLE "_SignHandConfigs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SignHandConfigs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SignHandConfigs_B_index" ON "_SignHandConfigs"("B");

-- AddForeignKey
ALTER TABLE "_SignHandConfigs" ADD CONSTRAINT "_SignHandConfigs_A_fkey" FOREIGN KEY ("A") REFERENCES "HandConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_SignHandConfigs" ADD CONSTRAINT "_SignHandConfigs_B_fkey" FOREIGN KEY ("B") REFERENCES "Sign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migra a configuração única atual de cada sinal para a tabela de junção
INSERT INTO "_SignHandConfigs" ("A", "B")
SELECT "handConfigId", "id" FROM "Sign" WHERE "handConfigId" IS NOT NULL;

-- Remove a coluna antiga
ALTER TABLE "Sign" DROP CONSTRAINT IF EXISTS "Sign_handConfigId_fkey";
DROP INDEX IF EXISTS "Sign_handConfigId_idx";
ALTER TABLE "Sign" DROP COLUMN "handConfigId";
