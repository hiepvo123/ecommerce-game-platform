import api from './api';

export const referenceService = {
  getLanguages: async () => {
    const response = await api.get('/reference/languages');
    return response.data;
  },

  getLanguageById: async (id) => {
    const response = await api.get(`/reference/languages/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/reference/categories');
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await api.get(`/reference/categories/${id}`);
    return response.data;
  },

  getGenres: async () => {
    const response = await api.get('/reference/genres');
    return response.data;
  },

  getGenreById: async (id) => {
    const response = await api.get(`/reference/genres/${id}`);
    return response.data;
  },
};
