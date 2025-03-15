import { Router } from "express";
import { isAuthenticated, isAdmin } from "../middlewares/auth";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import {
  getOrders,
  getOrder,
  updateOrderStatus,
} from "../controllers/orderController";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { getDashboardStats } from "../controllers/dashboardController";
import {
  getUsers,
  getUser,
  createUser, // Verifica que esta importación existe
  updateUser,
  deleteUser,
} from "../controllers/userController";
// Importar las funciones del controlador de configuraciones
import {
  getSettings,
  updateSettings,
  clearCache,
  resetDatabase,
} from "../controllers/settingsController";

const router = Router();

// Proteger todas las rutas admin
router.use(isAuthenticated, isAdmin);

// Dashboard
router.get("/dashboard/stats", (req, res) => {
  // Datos simulados para el dashboard
  res.json({
    success: true,
    data: {
      products: 125,
      productsChange: 8,
      sales: 1435.89,
      salesChange: 12.5,
      orders: 74,
      ordersChange: -3,
      users: 240,
      usersChange: 15,
    },
  });
  6;
});

// Usuarios
router.get("/users", getUsers);
router.get("/users/:id", getUser);
router.post("/users", createUser); // Esta línea debe estar presente
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Productos
router.get("/products", getProducts);
router.get("/products/:id", getProduct);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Órdenes
router.get("/orders", getOrders);
router.get("/orders/:id", getOrder);
router.put("/orders/:id/status", updateOrderStatus);

// Categorías
router.get("/categories", getCategories);
router.get("/categories/:id", getCategoryById);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// Rutas de configuración (admin)
router.get("/settings", isAuthenticated, isAdmin, getSettings);
router.put("/settings", isAuthenticated, isAdmin, updateSettings);
router.post("/settings/clear-cache", isAuthenticated, isAdmin, clearCache);
router.post(
  "/settings/reset-database",
  isAuthenticated,
  isAdmin,
  resetDatabase
);

export default router;
