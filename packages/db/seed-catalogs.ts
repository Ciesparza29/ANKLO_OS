import { getPrismaClient } from "./src/prisma-client.js";

const prisma = getPrismaClient();

async function main() {
  const organizationId = "00000000-0000-4000-8000-000000000002"; // From .env.example

  await prisma.productCategory.create({
    data: {
      organizationId,
      name: "Fijaciones",
      code: "FIJ",
    },
  });

  await prisma.productCategory.create({
    data: {
      organizationId,
      name: "Adhesivos",
      code: "ADH",
    },
  });

  await prisma.unitOfMeasure.create({
    data: {
      organizationId,
      name: "Pieza",
      symbol: "PZA",
    },
  });

  await prisma.unitOfMeasure.create({
    data: {
      organizationId,
      name: "Metro",
      symbol: "M",
    },
  });

  console.log("Seed completado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
