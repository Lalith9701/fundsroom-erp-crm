import { api } from './api';

export interface CustomerParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerType?: string;
}

export const customerService = {
  getAll: async (params?: CustomerParams) => {
    const res = await api.get('/customers', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/customers/${id}`);
    return res.data;
  },

  create: async (data: any) => {
    const res = await api.post('/customers', data);
    return res.data;
  },

  update: async (id: string, data: any) => {
    const res = await api.put(`/customers/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },

  addFollowUp: async (id: string, data: { notes: string; followUpDate?: string }) => {
    const res = await api.post(`/customers/${id}/followups`, data);
    return res.data;
  },
};
