import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import examReducer from './examSlice.js';
import dashboardReducer from './dashboardSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exam: examReducer,
    dashboard: dashboardReducer,
  },
});
