import { prismaClient } from "../utils/prismaClient";
import { Prisma } from "@prisma/client";

// Tipado fuerte para los parámetros
export interface OrderItemInput {
  productId: string; // UUID como string
  quantity: number;
}

// Interfaces para estructuras internas
interface OrderItemCreate {
  productId: string;
  quantity: number;
  price: number;
}

interface StockUpdate {
  productId: string;
  change: number;
}

export class OrderService {
  async getOrders(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string; // Ignoramos este campo ya que no existe en el schema
  }) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    // Crear cláusula where
    const where: Prisma.OrderWhereInput = {};

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Obtener órdenes con paginación
    const [orders, total] = await Promise.all([
      prismaClient.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prismaClient.order.count({ where }),
    ]);

    // Añadir un campo virtual "status" para compatibilidad con frontend
    const ordersWithStatus = orders.map((order) => ({
      ...order,
      status: "Pendiente", // Valor virtual, no existe en la DB
    }));

    return {
      orders: ordersWithStatus,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getUserOrders(userId: number) {
    const orders = await prismaClient.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Añadir un campo virtual "status" para compatibilidad con frontend
    return orders.map((order) => ({
      ...order,
      status: "Pendiente", // Valor virtual, no existe en la DB
    }));
  }

  async getOrderById(id: number, userId?: number) {
    const where = userId ? { id, userId } : { id };

    const order = await prismaClient.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) return null;

    // Añadir un campo virtual "status" para compatibilidad con frontend
    return {
      ...order,
      status: "Pendiente", // Valor virtual, no existe en la DB
    };
  }

  async createOrder(userId: number, items: OrderItemInput[]) {
    // Verificar stock y calcular total
    const orderItems: OrderItemCreate[] = [];
    let total = 0;
    const stockUpdates: StockUpdate[] = [];

    for (const item of items) {
      const product = await prismaClient.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Producto no encontrado: ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
        );
      }

      const itemPrice = Number(product.price);
      const subtotal = itemPrice * item.quantity;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
      });

      total += subtotal;

      // Registro para actualización de stock
      stockUpdates.push({
        productId: item.productId,
        change: -item.quantity,
      });
    }

    // Crear la orden usando transacción
    const result = await prismaClient.$transaction(async (tx) => {
      // Crear la orden
      const order = await tx.order.create({
        data: {
          userId,
          total,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Actualizar el stock de los productos
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.productId },
          data: {
            stock: {
              increment: update.change, // Para restar, usamos un valor negativo
            },
          },
        });
      }

      return order;
    });

    // Mapa a la respuesta esperada por el frontend
    // Añadir un campo virtual "status" para compatibilidad con frontend
    const orderWithStatus = {
      ...result,
      status: "Pendiente", // Valor virtual, no existe en la DB
    };

    return orderWithStatus;
  }

  async updateOrderStatus(id: number, status: string) {
    // Como no tenemos el campo "status" en la DB, solo simulamos la actualización
    // para mantener compatibilidad con el frontend
    const order = await prismaClient.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Orden no encontrada");
    }

    // Devolvemos la orden con el status virtual actualizado
    return {
      ...order,
      status, // Valor virtual que no se guarda en la DB
    };
  }

  async cancelOrder(id: number, userId: number, isAdmin: boolean) {
    // Primero verificar que la orden existe y pertenece al usuario
    const where = isAdmin ? { id } : { id, userId };

    const order = await prismaClient.order.findFirst({
      where,
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error(
        "Orden no encontrada o no tienes permisos para cancelarla"
      );
    }

    // Restaurar el stock de los productos (operación real)
    for (const item of order.items) {
      await prismaClient.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
        },
      });
    }

    // En un sistema real, aquí actualizaríamos el status en la DB
    // Como no tenemos ese campo, solo devolvemos la información simulada
    return {
      ...order,
      status: "Cancelado", // Valor virtual que no se guarda en la DB
    };
  }
}

// Instancia única para usar en toda la aplicación
export const orderService = new OrderService();
