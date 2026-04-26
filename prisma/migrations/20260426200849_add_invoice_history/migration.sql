-- AlterTable
ALTER TABLE "InvoicePrice" ADD COLUMN     "invoiceId" TEXT;

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "lineItemCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InvoicePrice" ADD CONSTRAINT "InvoicePrice_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
