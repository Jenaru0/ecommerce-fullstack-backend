// filepath: c:\Users\jonna\OneDrive\Escritorio\ecommerce-fullstack\backend\src\__tests__\services\productService.test.ts
import { ProductService } from "../../services/productService";
import { prismaMock } from "../setup";
import { Prisma, PrismaClient } from "@prisma/client";

describe("ProductService", () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
  });

  describe("getAll", () => {
    it("should return products correctly", async () => {
      // Mock data
      const mockProducts = [
        {
          id: "1",
          name: "Test Product",
          description: "Test Description",
          price: new Prisma.Decimal(19.99),
          stock: 10,
          imageUrl: "test.jpg",
          rating: 4.5,
          reviewsCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          fullDescription: null,
          originalPrice: null,
          additionalImages: [],
          category: null,
          features: [],
          specifications: null,
          faqs: null,
          variants: null,
          isNewArrival: false,
        },
      ];

      // Setup the mock
      prismaMock.product.findMany.mockResolvedValue(mockProducts);

      // Execute the service method
      const result = await productService.getAll();

      // Verify the result
      expect(result).toEqual(mockProducts);
      expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
