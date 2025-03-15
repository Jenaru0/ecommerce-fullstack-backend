// filepath: c:\Users\jonna\OneDrive\Escritorio\ecommerce-fullstack\backend\src\routes\docs.ts
import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../docs/swagger";

const router = Router();

router.use("/", swaggerUi.serve);
router.get(
  "/",
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

// Endpoint para obtener el JSON de la especificación OpenAPI
router.get("/json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

export default router;
