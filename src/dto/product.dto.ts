// src/dto/product.dto.ts
export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock: number;
  categoryId?: number | null; // Actualizar para aceptar null
}

// Crear un DTO específico para actualización
export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  stock?: number;
  categoryId?: number | null;
  features?: string[];
  isNewArrival?: boolean;
  fullDescription?: string;
}
