import { Router } from "express";
import {
  getOrders,
  getMyOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder, // Añadir nuevo controlador
} from "../controllers/orderController";
import { isAuthenticated, isAdmin } from "../middlewares/auth";

const router = Router();

// Rutas para administradores
router.get("/", isAuthenticated, isAdmin, getOrders);
router.patch("/:id/status", isAuthenticated, isAdmin, updateOrderStatus);

// Rutas para usuarios autenticados
router.get("/my", isAuthenticated, getMyOrders);
router.get("/:id", isAuthenticated, getOrder);
router.post("/", isAuthenticated, createOrder);
router.put("/:id/cancel", isAuthenticated, cancelOrder); // Ruta para cancelar órdenes

export default router;
