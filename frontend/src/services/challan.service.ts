import { api } from './api';

export interface ChallanParams {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
  search?: string;
}

export interface ChallanItemInput {
  productId: string;
  quantity: number;
}

export const challanService = {
  getAll: async (params?: ChallanParams) => {
    const res = await api.get('/challans', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/challans/${id}`);
    return res.data;
  },

  create: async (data: { customerId: string; items: ChallanItemInput[] }) => {
    const res = await api.post('/challans', data);
    return res.data;
  },

  confirm: async (id: string) => {
    const res = await api.post(`/challans/${id}/confirm`);
    return res.data;
  },

  cancel: async (id: string) => {
    const res = await api.post(`/challans/${id}/cancel`);
    return res.data;
  },
};
