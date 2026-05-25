import { ApiService } from './apiService';

export const AdminService = {
  getStats: async () => {
    return ApiService.getDashboardStats();
  }
};
