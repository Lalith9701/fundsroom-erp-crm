import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { ChallanStatus, MovementType } from '../../types/enums';
import { generateChallanNumber } from '../../utils/challanNumber';

export interface ChallanQueryOptions {
  page?: number;
  limit?: number;
  status?: ChallanStatus;
  customerId?: string;
  search?: string;
}

export interface CreateChallanItemDTO {
  productId: string;
  quantity: number;
}

export class ChallansService {
  static async getAll(options: ChallanQueryOptions) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.customerId) {
      where.customerId = options.customerId;
    }

    if (options.search && options.search.trim() !== '') {
      const query = options.search.trim();
      where.OR = [
        { challanNumber: { contains: query, mode: 'insensitive' } },
        { customer: { name: { contains: query, mode: 'insensitive' } } },
        { customer: { businessName: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, email: true, mobile: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.challan.count({ where }),
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

  static async getById(id: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, currentStock: true, unitPrice: true },
            },
          },
        },
      },
    });

    if (!challan) {
      throw new NotFoundError(`Challan with ID '${id}' not found`);
    }

    return challan;
  }

  static async create(customerId: string, items: CreateChallanItemDTO[], createdById: string) {
    if (!customerId) {
      throw new BadRequestError('Customer ID is required');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Challan must contain at least one item');
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError(`Customer with ID '${customerId}' not found`);
    }

    // Validate item structure and fetch current product snapshots
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalQuantity = 0;
    const itemSnapshots = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new BadRequestError('Each item must have a valid productId and a positive quantity');
      }

      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundError(`Product with ID '${item.productId}' not found`);
      }

      const qty = parseInt(item.quantity as any, 10);
      totalQuantity += qty;

      itemSnapshots.push({
        productId: product.id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: qty,
      });
    }

    const challanNumber = await generateChallanNumber();

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId,
        totalQuantity,
        status: ChallanStatus.DRAFT,
        createdById,
        items: {
          create: itemSnapshots,
        },
      },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        items: true,
      },
    });

    return challan;
  }

  static async confirm(id: string, userId: string) {
    const existingChallan = await prisma.challan.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingChallan) {
      throw new NotFoundError(`Challan with ID '${id}' not found`);
    }

    if (existingChallan.status === ChallanStatus.CONFIRMED) {
      throw new BadRequestError(`Challan ${existingChallan.challanNumber} has already been confirmed`);
    }

    if (existingChallan.status === ChallanStatus.CANCELLED) {
      throw new BadRequestError(`Cannot confirm a cancelled challan`);
    }

    // Database transaction to perform stock verification and atomic update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check stock for every product in the challan
      for (const item of existingChallan.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new BadRequestError(`Product '${item.productNameSnapshot}' no longer exists`);
        }

        if (product.currentStock < item.quantity) {
          throw new BadRequestError(`Insufficient stock for ${product.name}`);
        }
      }

      // 2. Reduce stock & create stock movements for each item
      for (const item of existingChallan.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) continue;

        const newStock = product.currentStock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: MovementType.OUT,
            reason: `Sales Challan Confirmation: ${existingChallan.challanNumber}`,
            createdById: userId,
          },
        });
      }

      // 3. Mark Challan as CONFIRMED
      const confirmedChallan = await tx.challan.update({
        where: { id },
        data: { status: ChallanStatus.CONFIRMED },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          items: true,
        },
      });

      return confirmedChallan;
    });

    return result;
  }

  static async cancel(id: string) {
    const existingChallan = await prisma.challan.findUnique({
      where: { id },
    });

    if (!existingChallan) {
      throw new NotFoundError(`Challan with ID '${id}' not found`);
    }

    if (existingChallan.status === ChallanStatus.CONFIRMED) {
      throw new BadRequestError('Cannot cancel an already confirmed challan');
    }

    if (existingChallan.status === ChallanStatus.CANCELLED) {
      throw new BadRequestError('Challan is already cancelled');
    }

    const cancelledChallan = await prisma.challan.update({
      where: { id },
      data: { status: ChallanStatus.CANCELLED },
      include: {
        customer: true,
        items: true,
      },
    });

    return cancelledChallan;
  }
}
