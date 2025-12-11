import api from './api';

export const gameService = {
  getGames: async (params = {}) => {
    const response = await api.get('/games', { params });
    return response.data;
  },

  getGameById: async (appId) => {
    const response = await api.get(`/games/${appId}`);
    return response.data;
  },

  searchGames: async (query, params = {}) => {
    const response = await api.get('/games/search', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  getRecommendedGames: async () => {
    const response = await api.get('/games/recommended');
    return response.data;
  },

  getFeaturedGames: async () => {
    const response = await api.get('/games/featured');
    return response.data;
  },

  getDiscountedGames: async () => {
    const response = await api.get('/games/discounted');
    return response.data;
  },

  getGamesByGenre: async (genreId, params = {}) => {
    const response = await api.get(`/games/genre/${genreId}`, { params });
    return response.data;
  },

  getGamesByCategory: async (categoryId, params = {}) => {
    const response = await api.get(`/games/category/${categoryId}`, { params });
    return response.data;
  },
};
