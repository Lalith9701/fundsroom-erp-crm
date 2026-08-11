import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/enums';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User authentication required'));
    }

    // ADMIN has full access across all operations
    if (req.user.role === Role.ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `User with role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};
