import { Router } from 'express';
import { ChallansController } from './challans.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  ChallansController.getAll
);

router.get(
  '/:id',
  authorize([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  ChallansController.getById
);

router.post(
  '/',
  authorize([Role.ADMIN, Role.SALES]),
  ChallansController.create
);

router.post(
  '/:id/confirm',
  authorize([Role.ADMIN, Role.SALES]),
  ChallansController.confirm
);

router.post(
  '/:id/cancel',
  authorize([Role.ADMIN, Role.SALES]),
  ChallansController.cancel
);

export default router;
