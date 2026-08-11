import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/response';

export class DashboardController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await DashboardService.getStats();
      return sendSuccess(res, 'Dashboard statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }
}
