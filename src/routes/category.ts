import { Router } from "express";
import { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory,
  deleteCategory
} from "../controllers/categoryController";
import { isAuthenticated, isAdmin } from "../middlewares/auth";

const router = Router();

// Rutas públicas
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Rutas protegidas (admin)
router.post("/", isAuthenticated, isAdmin, createCategory);
router.put("/:id", isAuthenticated, isAdmin, updateCategory);
router.delete("/:id", isAuthenticated, isAdmin, deleteCategory);

export default router;
