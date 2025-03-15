// filepath: c:\Users\jonna\OneDrive\Escritorio\ecommerce-fullstack\backend\src\docs\swagger.ts
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API E-commerce",
      version: "1.0.0",
      description: "Documentación de la API del sistema de e-commerce",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Servidor de desarrollo",
      },
      {
        url: "https://api.tudominio.com/api",
        description: "Servidor de producción",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              default: false,
            },
            message: {
              type: "string",
            },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
            },
            description: {
              type: "string",
            },
            price: {
              type: "number",
            },
            imageUrl: {
              type: "string",
            },
            stock: {
              type: "integer",
            },
            rating: {
              type: "number",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            // Otros campos del producto
          },
        },
        // Otros esquemas...
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], // Rutas a los archivos con anotaciones JSDoc
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
