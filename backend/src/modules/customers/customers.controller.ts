import { Request, Response, NextFunction } from 'express';
import { CustomersService } from './customers.service';
import { sendSuccess } from '../../utils/response';

export class CustomersController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, status, customerType } = req.query;
      const result = await CustomersService.getAll({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string,
        status: status as any,
        customerType: customerType as any,
      });
      return sendSuccess(res, 'Customers retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomersService.getById(req.params.id);
      return sendSuccess(res, 'Customer details retrieved successfully', customer);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomersService.create(req.body);
      return sendSuccess(res, 'Customer created successfully', customer, 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomersService.update(req.params.id, req.body);
      return sendSuccess(res, 'Customer updated successfully', customer);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CustomersService.delete(req.params.id);
      return sendSuccess(res, 'Customer deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async addFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const { notes, followUpDate } = req.body;
      const createdById = req.user!.id;
      const followUp = await CustomersService.addFollowUp(
        req.params.id,
        createdById,
        notes,
        followUpDate
      );
      return sendSuccess(res, 'Follow-up note added successfully', followUp, 201);
    } catch (error) {
      next(error);
    }
  }
}
