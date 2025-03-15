// filepath: c:\Users\jonna\OneDrive\Escritorio\ecommerce-fullstack\backend\src\middlewares\errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { logger } from "../utils/logger";

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Asegúrate de que el middleware tenga exactamente 4 parámetros (importante para Express)
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Loguear el error
  logger.error(`Error: ${err.message}`, {
    path: req.path,
    method: req.method,
    error: err.stack || err.toString(),
  });

  // Error de validación con Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: err.errors,
    });
    return;
  }

  // Error personalizado de API
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Errores de Prisma
  if (err instanceof PrismaClientKnownRequestError) {
    // Error de clave única (duplicado)
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        message: `Ya existe un registro con el mismo valor para: ${err.meta?.target}`,
      });
      return;
    }

    // Error de registro no encontrado
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Recurso no encontrado",
      });
      return;
    }
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
};
