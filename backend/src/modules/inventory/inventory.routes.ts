import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/authorize.middleware';
import { Role } from '../../types/enums';

const router = Router();

router.use(authenticate);

router.get(
  '/stock-movements',
  authorize([Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]),
  InventoryController.getMovements
);

router.post(
  '/stock-movements',
  authorize([Role.ADMIN, Role.WAREHOUSE]),
  InventoryController.createMovement
);

export default router;
