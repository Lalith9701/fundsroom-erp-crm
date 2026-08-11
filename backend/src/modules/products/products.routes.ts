import { Router } from 'express';
import { ProductsController } from './products.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  ProductsController.getAll
);

router.get(
  '/:id',
  authorize([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  ProductsController.getById
);

router.post(
  '/',
  authorize([Role.ADMIN, Role.WAREHOUSE]),
  ProductsController.create
);

router.put(
  '/:id',
  authorize([Role.ADMIN, Role.WAREHOUSE]),
  ProductsController.update
);

export default router;
