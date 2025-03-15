import { Request, Response } from "express";
import { prismaClient } from "../utils/prismaClient";

export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Contar productos
    const productsCount = await prismaClient.product.count();

    // Contar productos nuevos (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newProductsCount = await prismaClient.product.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calcular cambio porcentual en productos
    const productsChange =
      productsCount > 0
        ? Math.round((newProductsCount / productsCount) * 100)
        : 0;

    // Obtener total de ventas
    const salesData = await prismaClient.order.aggregate({
      _sum: {
        total: true,
      },
    });

    // Corregido: Eliminada la llamada a toNumber()
    const totalSales = salesData._sum.total || 0;

    // Obtener ventas de los últimos 30 días
    const recentSalesData = await prismaClient.order.aggregate({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Corregido: Eliminada la llamada a toNumber()
    const recentSales = recentSalesData._sum.total || 0;

    // Calcular cambio en ventas
    const salesChange =
      totalSales > 0 ? Math.round((recentSales / totalSales) * 100) : 0;

    // Contar órdenes
    const ordersCount = await prismaClient.order.count();

    // Contar órdenes recientes
    const newOrdersCount = await prismaClient.order.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calcular cambio en órdenes
    const ordersChange =
      ordersCount > 0 ? Math.round((newOrdersCount / ordersCount) * 100) : 0;

    // Contar usuarios
    const usersCount = await prismaClient.user.count();

    // Contar usuarios nuevos
    const newUsersCount = await prismaClient.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calcular cambio en usuarios
    const usersChange =
      usersCount > 0 ? Math.round((newUsersCount / usersCount) * 100) : 0;

    res.json({
      success: true,
      data: {
        products: productsCount,
        productsChange,
        sales: totalSales,
        salesChange,
        orders: ordersCount,
        ordersChange,
        users: usersCount,
        usersChange,
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas del dashboard",
    });
  }
};
