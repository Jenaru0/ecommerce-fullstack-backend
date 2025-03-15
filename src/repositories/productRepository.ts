// Ejemplo para src/repositories/productRepository.ts
export class ProductRepository {
  async findById(id: string) {
    return prismaClient.product.findUnique({ where: { id } });
  }
  // Otros métodos CRUD
}
