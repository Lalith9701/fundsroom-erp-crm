import { prisma } from '../../config/prisma';
import { ChallanStatus } from '@prisma/client';

export class DashboardService {
  static async getStats() {
    const [
      totalCustomers,
      totalProducts,
      allProducts,
      totalChallans,
      draftChallans,
      confirmedChallans,
      recentChallans,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.product.findMany({
        select: { id: true, name: true, sku: true, currentStock: true, minStockAlert: true, category: true },
      }),
      prisma.challan.count(),
      prisma.challan.count({ where: { status: ChallanStatus.DRAFT } }),
      prisma.challan.count({ where: { status: ChallanStatus.CONFIRMED } }),
      prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } },
        },
      }),
    ]);

    const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minStockAlert);

    return {
      metrics: {
        totalCustomers,
        totalProducts,
        lowStockProductsCount: lowStockProducts.length,
        totalChallans,
        draftChallans,
        confirmedChallans,
      },
      lowStockProducts: lowStockProducts.slice(0, 5),
      recentChallans,
    };
  }
}
