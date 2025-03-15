import { Request, Response } from "express";
import { prismaClient } from "../utils/prismaClient";
import { z } from "zod";

// Schema de validación para categorías
const categorySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
});

type CategoryInput = z.infer<typeof categorySchema>;

// Obtener todas las categorías
export const getCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await prismaClient.category.findMany();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las categorías",
    });
  }
};

// Obtener categoría por ID
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);

    const category = await prismaClient.category.findUnique({
      where: { id: categoryId },
      include: { products: true },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
      return;
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error al obtener categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la categoría",
    });
  }
};

// Crear categoría (admin)
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validatedData: CategoryInput = categorySchema.parse(req.body);

    const newCategory = await prismaClient.category.create({
      data: validatedData,
    });

    res.status(201).json({
      success: true,
      message: "Categoría creada con éxito",
      data: newCategory,
    });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la categoría",
    });
  }
};

// Actualizar categoría (admin)
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);
    const validatedData: CategoryInput = categorySchema.parse(req.body);

    const updatedCategory = await prismaClient.category.update({
      where: { id: categoryId },
      data: validatedData,
    });

    res.json({
      success: true,
      message: "Categoría actualizada con éxito",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la categoría",
    });
  }
};

// Eliminar categoría (admin)
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);

    await prismaClient.category.delete({
      where: { id: categoryId },
    });

    res.json({
      success: true,
      message: "Categoría eliminada con éxito",
    });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la categoría",
    });
  }
};
