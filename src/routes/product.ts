// Rutas para productos
// filepath: c:\Users\jonna\OneDrive\Escritorio\ecommerce-fullstack\backend\src\routes\product.ts
import { Router } from "express";
import {
  getProducts,
  getProduct,
  getProductReviews,
  createProductReview,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { isAuthenticated, isAdmin } from "../middlewares/auth";

const router = Router();

// Rutas públicas
router.get("/", getProducts);
router.get("/:id", getProduct);
router.get("/:id/reviews", getProductReviews);

// Rutas que requieren autenticación
router.post("/:id/reviews", isAuthenticated, createProductReview);

// Rutas protegidas (admin)
router.post("/", isAuthenticated, isAdmin, createProduct);
router.put("/:id", isAuthenticated, isAdmin, updateProduct);
router.delete("/:id", isAuthenticated, isAdmin, deleteProduct);

export default router;
