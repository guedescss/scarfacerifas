DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Order" LIMIT 1) THEN
        RAISE EXCEPTION 'A migração de contas exige a migração/exportação dos pedidos antigos antes de continuar.';
    END IF;
END $$;

CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

DROP INDEX "Order_buyerPhone_idx";

ALTER TABLE "Order"
    ADD COLUMN "userId" TEXT NOT NULL,
    DROP COLUMN "buyerName",
    DROP COLUMN "buyerPhone";

CREATE INDEX "Order_userId_idx" ON "Order"("userId");

ALTER TABLE "Order"
    ADD CONSTRAINT "Order_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "Profile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
