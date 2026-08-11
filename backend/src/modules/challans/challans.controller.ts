import { Request, Response, NextFunction } from 'express';
import { ChallansService } from './challans.service';
import { sendSuccess } from '../../utils/response';

export class ChallansController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, customerId, search } = req.query;
      const result = await ChallansService.getAll({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        status: status as any,
        customerId: customerId as string,
        search: search as string,
      });
      return sendSuccess(res, 'Challans retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const challan = await ChallansService.getById(req.params.id);
      return sendSuccess(res, 'Challan details retrieved successfully', challan);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, items } = req.body;
      const createdById = req.user!.id;
      const challan = await ChallansService.create(customerId, items, createdById);
      return sendSuccess(res, 'Draft Sales Challan created successfully', challan, 201);
    } catch (error) {
      next(error);
    }
  }

  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const challan = await ChallansService.confirm(req.params.id, userId);
      return sendSuccess(res, 'Sales Challan confirmed successfully and stock updated', challan);
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const challan = await ChallansService.cancel(req.params.id);
      return sendSuccess(res, 'Sales Challan cancelled successfully', challan);
    } catch (error) {
      next(error);
    }
  }
}
