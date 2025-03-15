import { Router } from "express";
import { isAuthenticated, isAdmin } from "../middlewares/auth";

const router = Router();

/**
 * Rutas públicas (ninguna por ahora)
 */

/**
 * Rutas que requieren autenticación
 */
router.get("/profile", isAuthenticated, (req, res) => {
  // Enviar información del usuario desde el middleware de autenticación
  res.json({
    success: true,
    data: {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      // Quitamos name ya que no existe en el tipo User
    },
  });
});

/**
 * Rutas que requieren ser administrador
 */
router.get("/", isAuthenticated, isAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Lista de usuarios (próximamente)",
  });
});

export default router;
