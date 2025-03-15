// src/routes/index.ts - Router central
import { Router } from "express";
import authRoutes from "./auth";
import productRoutes from "./product";
import orderRoutes from "./order";
import userRoutes from "./user";
import categoryRoutes from "./category";
import adminRoutes from "./admin";
import docsRoutes from "./docs";

const router = Router();

// Documentación API
router.use("/docs", docsRoutes);

// Es importante montar las rutas admin antes de otras rutas para evitar conflictos
router.use("/admin", adminRoutes);

// Rutas públicas agrupadas por funcionalidad
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);

export default router;
