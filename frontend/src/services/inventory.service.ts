import { api } from './api';

export interface InventoryParams {
  page?: number;
  limit?: number;
  productId?: string;
  movementType?: 'IN' | 'OUT';
}

export const inventoryService = {
  getMovements: async (params?: InventoryParams) => {
    const res = await api.get('/stock-movements', { params });
    return res.data;
  },

  createMovement: async (data: {
    productId: string;
    quantity: number;
    movementType: 'IN' | 'OUT';
    reason: string;
  }) => {
    const res = await api.post('/stock-movements', data);
    return res.data;
  },
};
