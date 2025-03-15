import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prismaClient } from "../utils/prismaClient";

// Extender el tipo Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        name?: string;
      };
    }
    interface User {
      id: number;
      email: string;
      role: string;
      // Si name debe estar disponible, asegúrate de añadirlo aquí
    }
  }
}

// Asegúrese de que el tipo Request tenga la propiedad name
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        name?: string;
      };
    }
  }
}

// Verificar que JWT_SECRET esté configurado
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET no está configurado en variables de entorno");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware para verificar si el usuario está autenticado
 */
export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obtener el token del header de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No autorizado: Token no proporcionado",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
    };

    // Verificar que el usuario existe en la BD
    const user = await prismaClient.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "No autorizado: Usuario no encontrado",
      });
      return;
    }

    // Añadir los datos del usuario al objeto request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "No autorizado: Token inválido",
      });
      return;
    }

    console.error("Error de autenticación:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
};

/**
 * Middleware para verificar si el usuario es administrador
 * Debe usarse después de isAuthenticated
 */
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "No autorizado: Usuario no autenticado",
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Acceso prohibido: Se requiere rol de administrador",
    });
    return;
  }

  next();
};
