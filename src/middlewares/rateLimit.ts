// filepath: c:\Users\jonna\OneDrive\Escritorio\ecommerce-fullstack\backend\src\middlewares\rateLimit.ts
import rateLimit from "express-rate-limit";

// Configuración para rutas generales
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 solicitudes por ventana
  standardHeaders: true,
  message: {
    success: false,
    message: "Demasiadas solicitudes, por favor intente más tarde",
  },
});

// Configuración más estricta para rutas de autenticación
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 intentos por hora
  standardHeaders: true,
  message: {
    success: false,
    message: "Demasiados intentos de login, por favor intente más tarde",
  },
});

// Configuración para rutas de creación
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // máximo 50 creaciones por hora
  standardHeaders: true,
  message: {
    success: false,
    message: "Demasiadas solicitudes de creación, por favor intente más tarde",
  },
});
