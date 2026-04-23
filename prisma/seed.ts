import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_UNPOOLED!,
})
const prisma = new PrismaClient({ adapter })


async function main() {
  // ─── System Recipe Categories ────────────────────────────────
  const categories = [
    "Appetizer", "Entrée", "Dessert", "Sauce",
    "Soup", "Salad", "Side", "Beverage", "Other"
  ]

  for (const name of categories) {
    await prisma.recipeCategory.upsert({
      where: { name_organizationId: { name, organizationId: "" } },
      update: {},
      create: { name, isSystem: true, organizationId: null },
    })
  }

  // ─── System Conversions ───────────────────────────────────────
  const systemConversions = [
    // Volume
    { fromQty: 1, fromUnit: "tsp",   toQty: 0.3333, toUnit: "tbsp"  },
    { fromQty: 1, fromUnit: "tbsp",  toQty: 3,      toUnit: "tsp"   },
    { fromQty: 1, fromUnit: "tbsp",  toQty: 0.0625, toUnit: "cup"   },
    { fromQty: 1, fromUnit: "cup",   toQty: 16,     toUnit: "tbsp"  },
    { fromQty: 1, fromUnit: "cup",   toQty: 48,     toUnit: "tsp"   },
    { fromQty: 1, fromUnit: "cup",   toQty: 8,      toUnit: "fl oz" },
    { fromQty: 1, fromUnit: "fl oz", toQty: 0.125,  toUnit: "cup"   },
    { fromQty: 1, fromUnit: "qt",    toQty: 4,      toUnit: "cup"   },
    { fromQty: 1, fromUnit: "cup",   toQty: 0.25,   toUnit: "qt"    },
    { fromQty: 1, fromUnit: "gal",   toQty: 4,      toUnit: "qt"    },
    { fromQty: 1, fromUnit: "qt",    toQty: 0.25,   toUnit: "gal"   },
    { fromQty: 1, fromUnit: "gal",   toQty: 16,     toUnit: "cup"   },
    { fromQty: 1, fromUnit: "ml",    toQty: 0.001,  toUnit: "l"     },
    { fromQty: 1, fromUnit: "l",     toQty: 1000,   toUnit: "ml"    },
    // Weight
    { fromQty: 1, fromUnit: "oz",    toQty: 0.0625, toUnit: "lb"    },
    { fromQty: 1, fromUnit: "lb",    toQty: 16,     toUnit: "oz"    },
    { fromQty: 1, fromUnit: "g",     toQty: 0.001,  toUnit: "kg"    },
    { fromQty: 1, fromUnit: "kg",    toQty: 1000,   toUnit: "g"     },
  ]

  for (const conv of systemConversions) {
    await prisma.conversion.upsert({
      where: { id: `system-${conv.fromUnit}-${conv.toUnit}` },
      update: {},
      create: {
        id: `system-${conv.fromUnit}-${conv.toUnit}`,
        siteItemId: null,
        isSystem: true,
        fromQty: conv.fromQty,
        fromUnit: conv.fromUnit,
        toQty: conv.toQty,
        toUnit: conv.toUnit,
      },
    })
  }

  console.log("✅ Seeded system categories and conversions")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
