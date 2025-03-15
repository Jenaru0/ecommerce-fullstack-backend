// src/utils/prismaClient.ts
import { PrismaClient } from "@prisma/client";

export const prismaClient = new PrismaClient();

// Para cerrar conexión al finalizar la app
process.on("SIGINT", async () => {
  await prismaClient.$disconnect();
  process.exit(0);
});
