import { configureStore } from '@reduxjs/toolkit';
import flightReducer from './flightSlice';

// Kreiramo Redux store
const store = configureStore({
  reducer: {
    flight: flightReducer,
  },
});

export default store;