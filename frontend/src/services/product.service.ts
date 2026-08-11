import { api } from './api';

export interface ProductParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
}

export const productService = {
  getAll: async (params?: ProductParams) => {
    const res = await api.get('/products', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  create: async (data: any) => {
    const res = await api.post('/products', data);
    return res.data;
  },

  update: async (id: string, data: any) => {
    const res = await api.put(`/products/${id}`, data);
    return res.data;
  },
};
