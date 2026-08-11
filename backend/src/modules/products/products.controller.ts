import { Request, Response, NextFunction } from 'express';
import { ProductsService } from './products.service';
import { sendSuccess } from '../../utils/response';

export class ProductsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, category, lowStockOnly } = req.query;
      const result = await ProductsService.getAll({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        category: category as string,
        lowStockOnly: lowStockOnly === 'true',
      });
      return sendSuccess(res, 'Products retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductsService.getById(req.params.id);
      return sendSuccess(res, 'Product details retrieved successfully', product);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = req.user!.id;
      const product = await ProductsService.create(req.body, createdById);
      return sendSuccess(res, 'Product created successfully', product, 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductsService.update(req.params.id, req.body);
      return sendSuccess(res, 'Product updated successfully', product);
    } catch (error) {
      next(error);
    }
  }
}
