import { Request, Response } from "express";
import { z } from "zod";
import { userService } from "../services/userService";
import { prismaClient } from "../utils/prismaClient"; // Asegurar esta importación
import bcrypt from "bcrypt";

// Schema para validar creación de usuario
const createUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["admin", "cliente"]).default("cliente"),
});

// Schema para actualizar usuarios
const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .optional(),
  email: z.string().email("Email inválido").optional(),
  role: z
    .enum(["user", "admin"], {
      errorMap: () => ({ message: "Role debe ser 'user' o 'admin'" }),
    })
    .optional(),
});

// Obtener todos los usuarios
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.getAll();
    res.json({
      success: true,
      data: {
        users,
        total: users.length,
      },
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
    });
  }
};

// Crear un usuario nuevo
export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Datos recibidos para crear usuario:", req.body);

    const validatedData = createUserSchema.parse(req.body);

    // Verificar si el email ya existe
    const existingUser = await userService.findByEmail(validatedData.email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "El email ya está registrado",
      });
      return;
    }

    const newUser = await userService.create({
      email: validatedData.email,
      password: validatedData.password,
      name: validatedData.name || "",
      role: validatedData.role,
    });

    res.status(201).json({
      success: true,
      message: "Usuario creado con éxito",
      data: newUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.errors,
      });
      return;
    }

    console.error("Error al crear usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el usuario",
    });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: "ID de usuario inválido",
      });
      return;
    }

    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el usuario",
    });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: "ID de usuario inválido",
      });
      return;
    }

    // Validar datos de entrada
    const validatedData = updateUserSchema.parse(req.body);
    console.log("Datos validados:", validatedData);

    // Verificar que el usuario existe
    const existingUser = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
      return;
    }

    // Actualizar el usuario
    const updatedUser = await prismaClient.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: "Usuario actualizado con éxito",
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Error de validación:", error.errors);
      res.status(400).json({
        success: false,
        message: "Datos de usuario inválidos",
        errors: error.errors,
      });
      return;
    }

    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el usuario",
    });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: "ID de usuario inválido",
      });
      return;
    }

    // Verificar que el usuario existe
    const existingUser = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
      return;
    }

    // No permitir eliminar al propio usuario administrador
    if (req.user?.id === userId) {
      res.status(400).json({
        success: false,
        message: "No puedes eliminar tu propia cuenta",
      });
      return;
    }

    // Eliminar el usuario
    await prismaClient.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: "Usuario eliminado con éxito",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el usuario",
    });
  }
};
