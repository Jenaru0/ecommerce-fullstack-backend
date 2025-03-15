// src/schemas/authSchema.ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email({ message: "Debe ser un email válido" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  name: z.string().nonempty({ message: "El nombre es requerido" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
