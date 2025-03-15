// filepath: c:\Users\jonna\OneDrive\Escritorio\ecommerce-fullstack\backend\src\schemas\productSchema.ts
import { z } from "zod";

// Schema base para productos
export const productBaseSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  price: z.number().positive("El precio debe ser positivo"),
  stock: z.number().int().nonnegative("El stock no puede ser negativo"),
  imageUrl: z.string().url("Debe ser una URL válida").optional(),
  category: z.string().optional(),
  features: z.array(z.string()).optional(),
  isNewArrival: z.boolean().optional(),
});

// Schema para crear productos (requiere algunos campos obligatorios)
export const createProductSchema = productBaseSchema.extend({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  price: z.number().positive("El precio debe ser positivo"),
  stock: z.number().int().nonnegative("El stock no puede ser negativo"),
});

// Schema para actualizar productos (todos los campos son opcionales)
export const updateProductSchema = productBaseSchema.partial();

// Schema para filtrar productos en búsquedas
export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  isNewArrival: z.boolean().optional(),
  sortBy: z
    .enum([
      "price_asc",
      "price_desc",
      "name_asc",
      "name_desc",
      "newest",
      "rating",
    ])
    .optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

// Schema para reviews de productos
export const productReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3, "El comentario debe tener al menos 3 caracteres"),
});

// Exportar tipos de TypeScript inferidos de los schemas
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type ProductReviewInput = z.infer<typeof productReviewSchema>;
