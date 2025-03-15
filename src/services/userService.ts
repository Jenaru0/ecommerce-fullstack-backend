// src/services/userService.ts
import { prismaClient } from "../utils/prismaClient";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export class UserService {
  async findByEmail(email: string) {
    return prismaClient.user.findUnique({ where: { email } });
  }

  // Asegúrate de que la función create acepta el rol
  async create(userData: {
    email: string;
    password: string;
    name?: string;
    role?: string; // Asegúrate de que este parámetro esté presente
  }) {
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    return prismaClient.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name || null,
        role: userData.role || "cliente", // Usa el rol proporcionado o el predeterminado
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getAll() {
    return prismaClient.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getById(id: number) {
    return prismaClient.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async update(
    id: number,
    data: { name?: string; email?: string; password?: string; role?: string }
  ) {
    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    } else {
      delete updateData.password;
    }

    return prismaClient.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }
}

// Singleton para usar en toda la app
export const userService = new UserService();
