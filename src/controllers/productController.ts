import { Request, Response, RequestHandler } from "express"; // Añade RequestHandler
import { ProductService } from "../services/productService";
import { z } from "zod";

const productService = new ProductService();

// Schema de validación para productos
const productSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  price: z.number().positive("El precio debe ser positivo"),
  imageUrl: z.string().url("Debe ser una URL válida").optional(),
  stock: z.number().int().nonnegative("El stock no puede ser negativo"),
  categoryId: z.number().nullable().optional(), // Añadir soporte para categoryId
  // Si tienes campos adicionales como features, isNewArrival, etc., inclúyelos aquí
  features: z.array(z.string()).optional(),
  isNewArrival: z.boolean().optional(),
  fullDescription: z.string().optional(),
});

type ProductInput = z.infer<typeof productSchema>;

export class ProductController {
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      // Extrae todos los parámetros de consulta que podrían ser útiles
      const {
        category,
        search,
        categoryId,
        minPrice,
        maxPrice,
        sort,
        limit = 10,
        page = 1,
      } = req.query;

      let products;

      // Filtrar según la categoría solicitada
      if (category === "new-arrivals") {
        products = await productService.getNewArrivals(
          Number(limit),
          Number(page)
        );
      } else if (category === "top-selling") {
        products = await productService.getTopSelling(
          Number(limit),
          Number(page)
        );
      } else {
        // Corregir llamada a getAll pasando un objeto con las propiedades esperadas
        products = await productService.getAll({
          search: search as string,
          categoryId: categoryId ? Number(categoryId) : undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          sort: sort as string,
          page: Number(page),
          limit: Number(limit),
        });
      }

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const productId = id;

      if (!productId) {
        res.status(400).json({
          success: false,
          message: "ID de producto inválido",
        });
        return;
      }

      const product = await productService.getById(productId);

      if (!product) {
        res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        });
        return;
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("Error al obtener producto:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener el producto",
      });
    }
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const validatedData: ProductInput = productSchema.parse(req.body);

      const newProduct = await productService.create(validatedData);

      res.status(201).json({
        success: true,
        message: "Producto creado con éxito",
        data: newProduct,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Datos de producto inválidos",
          errors: error.errors,
        });
        return;
      }

      console.error("Error al crear producto:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear el producto",
      });
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID de producto inválido",
        });
        return;
      }

      console.log("Datos recibidos para actualización:", req.body);

      try {
        // Validar datos con Zod
        const productSchema = z.object({
          name: z.string().min(3).optional(),
          description: z.string().optional(),
          price: z.number().positive().optional(),
          imageUrl: z.string().url().optional(),
          stock: z.number().int().nonnegative().optional(),
          categoryId: z.number().int().positive().nullable().optional(),
        });

        const validatedData = productSchema.parse(req.body);

        // Actualizar producto con timeout para evitar bloqueos
        const updatedProduct = await Promise.race([
          productService.update(id, validatedData),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Tiempo de espera agotado")),
              15000
            )
          ),
        ]);

        res.json({
          success: true,
          message: "Producto actualizado con éxito",
          data: updatedProduct,
        });
      } catch (error: unknown) {
        console.error("Error específico al actualizar:", error);

        // Definir un mensaje de error predeterminado
        let errorMessage = "Error al actualizar el producto";

        // Verificar tipo de error para mensajes específicos
        if (error instanceof Error) {
          errorMessage =
            error.message.includes("categoría") ||
            error.message.includes("tiempo") ||
            error.message.includes("no existe")
              ? error.message
              : "Error al actualizar el producto";
        }

        res.status(500).json({
          success: false,
          message: errorMessage,
        });
      }
    } catch (error: unknown) {
      // Manejar errores de validación
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Datos de producto inválidos",
          errors: error.errors,
        });
        return;
      }

      console.error("Error general al actualizar producto:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const productId = id;

      if (!productId) {
        res.status(400).json({
          success: false,
          message: "ID de producto inválido",
        });
        return;
      }

      // Verificar que el producto existe
      const existingProduct = await productService.getById(productId);

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        });
        return;
      }

      // Eliminar el producto
      await productService.delete(productId);

      res.json({
        success: true,
        message: "Producto eliminado con éxito",
      });
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar el producto",
      });
    }
  }
}

// Singleton para usar en toda la app
export const productController = new ProductController();

// Exportar los métodos como funciones independientes
export const getProducts: RequestHandler =
  productController.getProducts.bind(productController);
export const getProduct: RequestHandler =
  productController.getProduct.bind(productController);
export const createProduct: RequestHandler =
  productController.createProduct.bind(productController);
export const updateProduct: RequestHandler =
  productController.updateProduct.bind(productController);
export const deleteProduct: RequestHandler =
  productController.deleteProduct.bind(productController);

export const getProductReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productId = req.params.id;
    const sort = (req.query.sort as string) || "newest";

    const reviews = await productService.getProductReviews(productId, sort);

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las reseñas del producto",
    });
  }
};

export const createProductReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productId = req.params.id;
    const userId = req.user!.id;

    const reviewSchema = z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().min(3),
    });

    const { rating, comment } = reviewSchema.parse(req.body);

    const review = await productService.createReview({
      rating,
      comment,
      userId,
      productId,
    });

    res.status(201).json({
      success: true,
      message: "Reseña creada con éxito",
      data: review,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Datos de reseña inválidos",
        errors: error.errors,
      });
      return;
    }

    console.error("Error al crear reseña:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la reseña",
    });
  }
};
