// backend/src/services/productService.ts
import { prismaClient } from "../utils/prismaClient";
import { Prisma } from "@prisma/client";

export class ProductService {
  async getAll(filters: {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Construir cláusula where para filtros
    let whereClause: Prisma.ProductWhereInput = {};

    if (filters.search) {
      whereClause = {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ],
      };
    }

    if (filters.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }

    if (filters.minPrice || filters.maxPrice) {
      whereClause.price = {};

      if (filters.minPrice) {
        whereClause.price.gte = new Prisma.Decimal(filters.minPrice);
      }

      if (filters.maxPrice) {
        whereClause.price.lte = new Prisma.Decimal(filters.maxPrice);
      }
    }

    // Determinar ordenamiento
    let orderBy: any = { createdAt: "desc" };

    if (filters.sort) {
      switch (filters.sort) {
        case "price_asc":
          orderBy = { price: "asc" };
          break;
        case "price_desc":
          orderBy = { price: "desc" };
          break;
        case "name_asc":
          orderBy = { name: "asc" };
          break;
        case "name_desc":
          orderBy = { name: "desc" };
          break;
        case "newest":
          orderBy = { createdAt: "desc" };
          break;
      }
    }

    // Ejecutar consulta principal
    const [products, total] = await Promise.all([
      prismaClient.product.findMany({
        where: whereClause,
        include: {
          category: true,
        },
        skip,
        take: limit,
        orderBy,
      }),
      prismaClient.product.count({ where: whereClause }),
    ]);

    // Mapear productos para añadir propiedades virtuales
    const formattedProducts = products.map((product) => ({
      ...product,
      // Propiedades virtuales para mantener compatibilidad con el frontend
      rating: 0,
      reviewsCount: 0,
    }));

    return {
      products: formattedProducts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getNewArrivals(limit: number = 10, page: number = 1) {
    const skip = (page - 1) * limit;

    const products = await prismaClient.product.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });

    // Añadir propiedades virtuales para mantener compatibilidad
    return products.map((product) => ({
      ...product,
      rating: 0,
      reviewsCount: 0,
    }));
  }

  async getTopSelling(limit: number = 10, page: number = 1) {
    const skip = (page - 1) * limit;

    // Obtener IDs de productos más vendidos (usando orderItems)
    const products = await prismaClient.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: limit,
      skip,
    });

    // Extraer los IDs en orden
    const productIds = products.map((p) => p.productId);

    // Si no hay productos, devolver array vacío
    if (!productIds.length) return [];

    // Obtener los productos completos
    const fullProducts = await prismaClient.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    // Ordenar manualmente según el orden de productIds
    const sortedProducts = [...fullProducts].sort((a, b) => {
      return productIds.indexOf(a.id) - productIds.indexOf(b.id);
    });

    // Añadir propiedades virtuales para mantener compatibilidad
    return sortedProducts.map((product) => ({
      ...product,
      rating: 0,
      reviewsCount: 0,
    }));
  }

  async getById(id: string) {
    try {
      const product = await prismaClient.product.findUnique({
        where: { id },
        include: {
          category: true,
        },
      });

      if (!product) return null;

      // Añadir propiedades virtuales para mantener compatibilidad
      return {
        ...product,
        rating: 0,
        reviews: [],
        reviewsCount: 0,
      };
    } catch (error) {
      console.error("Error en getById:", error);
      throw error;
    }
  }

  // Simulación de obtención de reseñas (devuelve array vacío)
  async getProductReviews(productId: string, sort?: string) {
    console.log(
      `Simulación: Obteniendo reseñas para producto ${productId}, ordenadas por: ${
        sort || "default"
      }`
    );
    return [];
  }

  // Simulación de creación de reseña (no hace nada real)
  async createReview(data: {
    rating: number;
    comment: string;
    userId: number;
    productId: string;
  }) {
    console.log(
      `Simulación: Usuario ${data.userId} agregó reseña a producto ${data.productId}`
    );

    return {
      id: 0,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async create(data: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    stock: number;
    categoryId?: number | null; // Modificar aquí para aceptar null
  }) {
    // Convertir precio a Decimal
    const productData = {
      name: data.name,
      description: data.description || "",
      price: new Prisma.Decimal(data.price),
      imageUrl: data.imageUrl || "",
      stock: data.stock,
      // Actualizar el manejo de categoryId
      categoryId: data.categoryId === null ? undefined : data.categoryId,
    };

    return prismaClient.product.create({
      data: productData,
      include: {
        category: true, // Incluir la categoría en la respuesta
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      stock?: number;
      categoryId?: number | null;
    }
  ) {
    console.log("Servicio recibe datos para actualizar:", data);

    try {
      // 1. Crear una copia limpia de los datos
      const updateData: any = { ...data };

      // 2. Convertir price a Decimal si está presente
      if (updateData.price !== undefined) {
        updateData.price = new Prisma.Decimal(updateData.price);
      }

      // 3. Extraer y eliminar categoryId del objeto principal
      const categoryId = updateData.categoryId;
      delete updateData.categoryId;

      // 4. Preparar la relación con la categoría
      if (categoryId === null) {
        // Caso 1: Desconectar categoría explícitamente
        updateData.category = { disconnect: true };
      } else if (categoryId !== undefined) {
        // Caso 2: Conectar con una categoría específica

        // Primero verificamos que la categoría exista
        const categoryExists = await prismaClient.category.findUnique({
          where: { id: Number(categoryId) },
        });

        if (!categoryExists) {
          throw new Error(`La categoría con ID ${categoryId} no existe`);
        }

        updateData.category = {
          connect: { id: Number(categoryId) },
        };
      }

      // 5. Realizar la actualización con manejo de errores adecuado
      console.log(
        "Datos preparados para actualización:",
        JSON.stringify(updateData, null, 2)
      );

      const result = await prismaClient.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      });

      console.log("Producto actualizado correctamente:", result.id);
      return result;
    } catch (error) {
      console.error("Error en la actualización del producto:", error);

      // Transformar errores de Prisma en mensajes más amigables
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new Error(`No se encontró el producto con ID ${id}`);
        } else if (error.code === "P2003") {
          throw new Error(
            "Error de relación: la categoría especificada no existe"
          );
        }
      }

      throw error;
    }
  }

  async delete(id: string) {
    return prismaClient.product.delete({
      where: { id },
    });
  }

  // Métodos simulados para mantener compatibilidad con el frontend
  async getReviews(productId: string) {
    // Devolver array vacío ya que no tenemos reviews
    return [];
  }

  async addReview(
    productId: string,
    userId: number,
    rating: number,
    comment: string
  ) {
    console.log(
      `Review simulada: Usuario ${userId} calificó ${productId} con ${rating} estrellas`
    );
    // No hacemos nada, solo simulamos la operación
    return {
      id: 0,
      rating,
      comment,
      userId,
      productId,
      createdAt: new Date(),
    };
  }
}

// Instancia única para usar en toda la aplicación
export const productService = new ProductService();
