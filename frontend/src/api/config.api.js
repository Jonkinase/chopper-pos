import api from './api';

export const configApi = {
  getAll: () => api.get('/config'),
  update: (data) => api.put('/config', data),
  uploadBanner: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/config/upload/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/config/upload/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteBanner: () => api.delete('/config/upload/banner'),
  deleteLogo: () => api.delete('/config/upload/logo'),
};
