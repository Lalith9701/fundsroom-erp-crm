import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { sendSuccess } from '../../utils/response';

export class InventoryController {
  static async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, productId, movementType } = req.query;
      const result = await InventoryService.getMovements({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        productId: productId as string,
        movementType: movementType as any,
      });
      return sendSuccess(res, 'Stock movements retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async createMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = req.user!.id;
      const result = await InventoryService.createMovement(req.body, createdById);
      return sendSuccess(res, 'Stock movement created successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }
}
