import { Request, Response } from "express";
import { z } from "zod";
import { orderService } from "../services/orderService";

// Schema para validar los items del pedido
const orderItemSchema = z.object({
  productId: z.string().uuid("ID de producto debe ser un UUID válido"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
});

// Schema para validar la creación de pedidos
const createOrderSchema = z.object({
  items: z.array(orderItemSchema).nonempty("Debe incluir al menos un producto"),
  shippingDetails: z
    .object({
      firstName: z.string().min(1, "El nombre es requerido"),
      lastName: z.string().min(1, "El apellido es requerido"),
      address: z.string().min(1, "La dirección es requerida"),
      city: z.string().min(1, "La ciudad es requerida"),
      zipCode: z.string().min(1, "El código postal es requerido"),
      state: z.string().min(1, "El estado/provincia es requerido"),
      phone: z.string().optional(),
    })
    .optional(),
  paymentMethod: z.enum(["card", "paypal"], {
    errorMap: () => ({ message: "Método de pago inválido" }),
  }),
  shipping: z.number().nonnegative(),
  total: z.number().positive(),
});

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extraer parámetros de consulta
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    // Pasar objeto de consulta correctamente
    const ordersData = await orderService.getOrders({
      page,
      limit,
      search,
      status,
    });

    res.json({ success: true, data: ordersData });
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las órdenes",
    });
  }
};

export const getMyOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    // Usar el nombre correcto del método
    const orders = await orderService.getUserOrders(userId);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error al obtener mis órdenes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tus órdenes",
    });
  }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);
    const userId = req.user!.id;
    const isAdmin = req.user!.role === "admin";

    if (isNaN(orderId)) {
      res.status(400).json({
        success: false,
        message: "ID de orden inválido",
      });
      return;
    }

    // Si es admin, puede ver cualquier orden
    // Si no es admin, solo puede ver sus propias órdenes
    const order = isAdmin
      ? await orderService.getOrderById(orderId)
      : await orderService.getOrderById(orderId, userId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Orden no encontrada",
      });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Error al obtener orden:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la orden",
    });
  }
};

export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { items, shippingDetails, paymentMethod, shipping, total } =
      createOrderSchema.parse(req.body);

    try {
      // Usar el método correcto: createOrder en lugar de create
      const order = await orderService.createOrder(userId, items);

      // Actualizar con datos de envío si se proporcionaron
      if (shippingDetails) {
        // Aquí iría la lógica para guardar los datos de envío
        console.log("Datos de envío recibidos:", shippingDetails);
      }

      res.status(201).json({
        success: true,
        message: "Orden creada con éxito",
        data: order,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        throw error; // Re-lanzar para el manejador general
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Datos de orden inválidos",
        errors: error.errors,
      });
      return;
    }

    console.error("Error al crear orden:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la orden",
    });
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      res.status(400).json({
        success: false,
        message: "ID de orden inválido",
      });
      return;
    }

    const { status } = z
      .object({
        status: z.enum([
          "Pendiente",
          "Procesando",
          "Enviado",
          "Entregado",
          "Cancelado",
        ]),
      })
      .parse(req.body);

    const updatedOrder = await orderService.updateOrderStatus(orderId, status);

    res.json({
      success: true,
      message: "Estado de orden actualizado",
      data: updatedOrder,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Estado inválido",
        errors: error.errors,
      });
      return;
    }

    console.error("Error al actualizar estado:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el estado de la orden",
    });
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);
    const userId = req.user!.id;
    const isAdmin = req.user!.role === "admin";

    if (isNaN(orderId)) {
      res.status(400).json({
        success: false,
        message: "ID de orden inválido",
      });
      return;
    }

    try {
      const canceledOrder = await orderService.cancelOrder(
        orderId,
        userId,
        isAdmin
      );

      res.json({
        success: true,
        message: "Orden cancelada con éxito",
        data: canceledOrder,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Error al cancelar orden:", error);
    res.status(500).json({
      success: false,
      message: "Error al cancelar la orden",
    });
  }
};
