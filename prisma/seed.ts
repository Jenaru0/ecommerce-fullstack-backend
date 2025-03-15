import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  // Crear usuarios de ejemplo
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: await bcrypt.hash("admin123", 12),
      name: "Administrador",
      role: "admin",
    },
  });

  const cliente = await prisma.user.upsert({
    where: { email: "cliente@example.com" },
    update: {},
    create: {
      email: "cliente@example.com",
      password: await bcrypt.hash("cliente123", 12),
      name: "Cliente Prueba",
    },
  });

  // Crear categorías
  const categoriesData = [
    { name: "Ropa", description: "Prendas para todas las ocasiones" },
    { name: "Calzado", description: "Zapatos y complementos para pies" },
    { name: "Accesorios", description: "Complementos y detalles de moda" },
  ];

  const categories = [];
  for (const data of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: data.name },
      update: {},
      create: data,
    });
    categories.push(category);
  }

  // Limpiar productos y pedidos previos (opcional)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});

  // Crear productos
  const productsData = [
    {
      name: "Camiseta básica negra",
      description: "Camiseta de algodón 100% con corte clásico.",
      price: new Prisma.Decimal(19.99),
      imageUrl:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format",
      stock: 50,
      category: "Ropa",
    },
    {
      name: "Zapatillas deportivas",
      description: "Zapatillas ligeras y cómodas para running.",
      price: new Prisma.Decimal(59.99),
      imageUrl:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format",
      stock: 30,
      category: "Calzado",
    },
    {
      name: "Reloj minimalista",
      description: "Reloj de pulsera con diseño moderno.",
      price: new Prisma.Decimal(99.99),
      imageUrl:
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format",
      stock: 20,
      category: "Accesorios",
    },
  ];

  const products = [];
  for (const prod of productsData) {
    // Buscar la categoría a la que pertenece el producto
    const cat = await prisma.category.findUnique({
      where: { name: prod.category },
    });
    const createdProduct = await prisma.product.create({
      data: {
        name: prod.name,
        description: prod.description,
        price: prod.price,
        imageUrl: prod.imageUrl,
        stock: prod.stock,
        categoryId: cat ? cat.id : undefined,
      },
    });
    products.push(createdProduct);
  }

  // Crear un pedido de ejemplo para el cliente
  const order = await prisma.order.create({
    data: {
      userId: cliente.id,
      total: Number(products[0].price) * 2, // Por ejemplo, 2 unidades del primer producto
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 2,
            price: Number(products[0].price),
          },
        ],
      },
    },
  });

  console.log("✅ Seed completado con éxito");
}

main()
  .catch((e) => {
    console.error("Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
