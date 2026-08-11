import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { MovementType } from '@prisma/client';

export interface StockMovementQueryOptions {
  page?: number;
  limit?: number;
  productId?: string;
  movementType?: MovementType;
}

export class InventoryService {
  static async getMovements(options: StockMovementQueryOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.productId) {
      where.productId = options.productId;
    }

    if (options.movementType) {
      where.movementType = options.movementType;
    }

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, currentStock: true, minStockAlert: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

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

  static async createMovement(data: any, createdById: string) {
    const { productId, quantity, movementType, reason } = data;

    if (!productId || quantity === undefined || !movementType || !reason) {
      throw new BadRequestError('Required fields missing: productId, quantity, movementType, reason');
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw new BadRequestError('Quantity must be a positive integer');
    }

    if (!Object.values(MovementType).includes(movementType)) {
      throw new BadRequestError(`Invalid movementType. Allowed values: ${Object.values(MovementType).join(', ')}`);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError(`Product with ID '${productId}' not found`);
    }

    let newStock = product.currentStock;
    if (movementType === MovementType.IN) {
      newStock += qty;
    } else if (movementType === MovementType.OUT) {
      if (product.currentStock < qty) {
        throw new BadRequestError(
          `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available: ${product.currentStock}, Requested: ${qty}`
        );
      }
      newStock -= qty;
    }

    // Atomic transaction updating product stock and logging stock movement
    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantity: qty,
          movementType,
          reason: reason.trim(),
          createdById,
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, currentStock: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      return { movement, updatedProduct };
    });

    return result;
  }
}
