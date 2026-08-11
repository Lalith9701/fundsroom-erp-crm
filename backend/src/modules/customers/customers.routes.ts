import { Router } from 'express';
import { CustomersController } from './customers.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { Role } from '../../types/enums';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  CustomersController.getAll
);

router.get(
  '/:id',
  authorize([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  CustomersController.getById
);

router.post(
  '/',
  authorize([Role.ADMIN, Role.SALES]),
  CustomersController.create
);

router.put(
  '/:id',
  authorize([Role.ADMIN, Role.SALES]),
  CustomersController.update
);

router.delete(
  '/:id',
  authorize([Role.ADMIN, Role.SALES]),
  CustomersController.delete
);

router.post(
  '/:id/followups',
  authorize([Role.ADMIN, Role.SALES]),
  CustomersController.addFollowUp
);

export default router;
