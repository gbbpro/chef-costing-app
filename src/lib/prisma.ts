import { PrismaPg } from "@prisma/adapter-pg"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client")

const globalForPrisma = globalThis as unknown as { prisma: any }

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma: any = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export { prisma }
