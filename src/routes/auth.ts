// src/routes/auth.ts
import { Router } from "express";
import { register, login } from "../controllers/authController";
import { isAuthenticated } from "../middlewares/auth";
import { prismaClient } from "../utils/prismaClient";
import bcrypt from "bcrypt";
import { z } from "zod";

const router = Router();

router.post("/register", register);
router.post("/login", login);

// Perfil del usuario autenticado
router.get("/profile", isAuthenticated, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user!.id,
      email: req.user!.email,
      name: req.user?.name || "",
      role: req.user!.role,
    },
  });
});

// Actualizar perfil del usuario
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(2).optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(6).optional(),
    });

    const validatedData = updateSchema.parse(req.body);
    const updateData: any = {};

    // Actualizar nombre si se proporciona
    if (validatedData.name) {
      updateData.name = validatedData.name;
    }

    // Si se intenta cambiar contraseña, verificar la actual
    if (validatedData.currentPassword && validatedData.newPassword) {
      const user = await prismaClient.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        res.status(400).json({
          success: false,
          message: "La contraseña actual es incorrecta",
        });
        return;
      }

      updateData.password = await bcrypt.hash(validatedData.newPassword, 12);
    }

    const updatedUser = await prismaClient.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    res.json({
      success: true,
      message: "Perfil actualizado con éxito",
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.errors,
      });
      return;
    }

    console.error("Error al actualizar perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el perfil",
    });
  }
});

export default router;
