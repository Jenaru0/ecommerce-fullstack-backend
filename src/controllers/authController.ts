// src/controllers/authController.ts
import { Request, Response } from "express";
import { registerSchema, RegisterInput } from "../schemas/authSchema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { ZodError, z } from "zod";

// Mejor práctica: importar desde un archivo centralizado
import { prismaClient } from "../utils/prismaClient";

// Verificar que JWT_SECRET esté configurado
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET no está configurado en variables de entorno");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12; // Mayor número = hash más seguro pero más lento

/**
 * Controlador para registrar nuevos usuarios
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar y parsear los datos usando Zod
    const validatedData: RegisterInput = registerSchema.parse(req.body);

    // Verificar si el usuario ya existe
    const existingUser = await prismaClient.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "El email ya está registrado",
      });
      return;
    }

    // Hash de la contraseña con mayor seguridad
    const hashedPassword = await bcrypt.hash(
      validatedData.password,
      SALT_ROUNDS
    );

    // Crear el usuario en la base de datos
    const newUser = await prismaClient.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
      },
      // Solo seleccionar los campos seguros para devolver
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generar token JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "1d" } // Aumentar tiempo de expiración
    );

    // Respuesta con formato consistente
    res.status(201).json({
      success: true,
      message: "Usuario registrado con éxito",
      data: { user: newUser, token },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Datos de registro inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

/**
 * Controlador para iniciar sesión
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Definir un esquema básico para login usando Zod
    const loginSchema = z.object({
      email: z.string().email({ message: "Debe ser un email válido" }),
      password: z
        .string()
        .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
    });

    // Validar y parsear los datos
    const { email, password } = loginSchema.parse(req.body);

    // Buscar el usuario en la base de datos
    const user = await prismaClient.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
      return;
    }

    // Comparar la contraseña proporcionada con el hash almacenado
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      res.status(401).json({
        success: false,
        message: "Contraseña incorrecta",
      });
      return;
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Responder con el token y datos del usuario (excluyendo la contraseña)
    res.json({
      success: true,
      message: "Login exitoso",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Datos de login inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};
