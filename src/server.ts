// src/server.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createWriteStream } from "fs";
import path from "path";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { apiLimiter } from "./middlewares/rateLimit";
import { logger, stream } from "./utils/logger";

// Cargar variables de entorno si es necesario
import dotenv from "dotenv";
dotenv.config();

// Inicializar Express
const app = express();
const port = process.env.PORT || 5000;

// Middleware de seguridad
app.use(helmet());

// Configuración CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Log de solicitudes HTTP
app.use(morgan("combined", { stream }));

// Parsear cuerpo de solicitudes JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Aplicar rate limiting
app.use("/api", apiLimiter);

// Añade estos logs antes de las rutas no encontradas
app.use("/api", (req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});
app.use("/api", routes);

// Rutas de la API
app.use("/api", routes);

// Ruta de health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Página de documentación simple
app.get("/", (req, res) => {
  res.send(`
    <h1>API de E-commerce</h1>
    <p>Usa los siguientes endpoints:</p>
    <ul>
      <li><strong>Autenticación:</strong>
        <ul>
          <li>POST /api/auth/register - Registro de usuario</li>
          <li>POST /api/auth/login - Inicio de sesión</li>
        </ul>
      </li>
      <li><strong>Productos:</strong>
        <ul>
          <li>GET /api/products - Lista de productos</li>
          <li>GET /api/products/:id - Detalle de producto</li>
          <li>POST /api/products - Crear producto (admin)</li>
          <li>PUT /api/products/:id - Actualizar producto (admin)</li>
          <li>DELETE /api/products/:id - Eliminar producto (admin)</li>
        </ul>
      </li>
      <li><strong>Órdenes:</strong>
        <ul>
          <li>GET /api/orders - Lista todas las órdenes (admin)</li>
          <li>GET /api/orders/my - Órdenes del usuario actual</li>
          <li>GET /api/orders/:id - Detalle de una orden</li>
          <li>POST /api/orders - Crear una nueva orden</li>
          <li>PATCH /api/orders/:id/status - Actualizar estado (admin)</li>
          <li>PUT /api/orders/:id/cancel - Cancelar orden</li>
        </ul>
      </li>
      <li><strong>Usuarios:</strong>
        <ul>
          <li>GET /api/users/profile - Perfil del usuario</li>
          <li>PUT /api/users/profile - Actualizar perfil</li>
          <li>GET /api/users - Listar usuarios (admin)</li>
        </ul>
      </li>
    </ul>
    <p><a href="/docs">Ver documentación completa de la API</a></p>
  `);
});

// Manejo de rutas no encontradas (debe ir antes del manejador de errores)
app.use((req, res) => {
  console.log(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  });
});

// Middleware para manejo de errores (IMPORTANTE: debe ser el último middleware y usar la ruta correcta)
app.use(errorHandler);

// Proceso de inicio
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Servidor iniciado en puerto ${port}`);
    console.log(`Servidor corriendo en el puerto ${port}`);
  });
}

// Exportar app para testing
export default app;
