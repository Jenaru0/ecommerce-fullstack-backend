// filepath: c:\Users\jonna\OneDrive\Escritorio\ecommerce-fullstack\backend\src\__tests__\setup.ts
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";

// Mock global de Prisma para pruebas
jest.mock("../utils/prismaClient", () => ({
  __esModule: true,
  prismaClient: mockDeep<PrismaClient>(),
}));

import { prismaClient } from "../utils/prismaClient";

const prismaMock = prismaClient as unknown as ReturnType<
  typeof mockDeep<PrismaClient>
>;

beforeEach(() => {
  mockReset(prismaMock);
});

export { prismaMock };
