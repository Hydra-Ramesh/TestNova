import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api.js';

export const fetchAnalytics = createAsyncThunk('dashboard/fetchAnalytics', async () => {
  const { data } = await api.get('/results/analytics');
  return data;
});

export const fetchTestHistory = createAsyncThunk('dashboard/fetchHistory', async () => {
  const { data } = await api.get('/results');
  return data.results;
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    analytics: null,
    testHistory: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => { state.loading = true; })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state) => { state.loading = false; })
      .addCase(fetchTestHistory.fulfilled, (state, action) => {
        state.testHistory = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
