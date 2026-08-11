import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { MovementType } from '@prisma/client';

export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
}

export class ProductsService {
  static async getAll(options: ProductQueryOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.category && options.category.trim() !== '') {
      where.category = { equals: options.category.trim(), mode: 'insensitive' };
    }

    if (options.search && options.search.trim() !== '') {
      const query = options.search.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { warehouseLocation: { contains: query, mode: 'insensitive' } },
      ];
    }

    let items = await prisma.product.findMany({
      where,
      skip: options.lowStockOnly ? undefined : skip,
      take: options.lowStockOnly ? undefined : limit,
      orderBy: { createdAt: 'desc' },
    });

    let total = await prisma.product.count({ where });

    if (options.lowStockOnly) {
      items = items.filter((item) => item.currentStock <= item.minStockAlert);
      total = items.length;
      // apply manual pagination after filtering
      items = items.slice(skip, skip + limit);
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            createdBy: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    return product;
  }

  static async create(data: any, createdById: string) {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, warehouseLocation } = data;

    if (!name || !sku || !category || unitPrice === undefined || !warehouseLocation) {
      throw new BadRequestError('Required fields missing: name, sku, category, unitPrice, warehouseLocation');
    }

    const parsedPrice = parseFloat(unitPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw new BadRequestError('Unit price must be a non-negative number');
    }

    const initialStock = parseInt(currentStock || 0, 10);
    if (isNaN(initialStock) || initialStock < 0) {
      throw new BadRequestError('Current stock must be a non-negative integer');
    }

    const minAlert = parseInt(minStockAlert || 5, 10);

    const existingSku = await prisma.product.findUnique({
      where: { sku: sku.trim().toUpperCase() },
    });

    if (existingSku) {
      throw new BadRequestError(`Product with SKU '${sku}' already exists`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          category: category.trim(),
          unitPrice: parsedPrice,
          currentStock: initialStock,
          minStockAlert: minAlert,
          warehouseLocation: warehouseLocation.trim(),
        },
      });

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: initialStock,
            movementType: MovementType.IN,
            reason: 'Initial stock on product creation',
            createdById,
          },
        });
      }

      return product;
    });

    return result;
  }

  static async update(id: string, data: any) {
    await this.getById(id);

    if (data.sku) {
      data.sku = data.sku.trim().toUpperCase();
      const existing = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestError(`Product SKU '${data.sku}' is already taken by another product`);
      }
    }

    if (data.unitPrice !== undefined) {
      const parsedPrice = parseFloat(data.unitPrice);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new BadRequestError('Unit price must be a non-negative number');
      }
      data.unitPrice = parsedPrice;
    }

    // Notice: currentStock should not be directly updated via PUT product, but via stock-movement. However if passed, ensure >= 0.
    if (data.currentStock !== undefined) {
      delete data.currentStock; // Enforce stock updates via stock-movements API
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });

    return updatedProduct;
  }
}
