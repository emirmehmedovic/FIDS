import { createSlice } from '@reduxjs/toolkit';

// Inicijalno stanje
const initialState = {
  selectedFlight: null,
};

// Kreiramo slice
const flightSlice = createSlice({
  name: 'flight',
  initialState,
  reducers: {
    selectFlight: (state, action) => {
      state.selectedFlight = action.payload;
    },
    clearFlight: (state) => {
      state.selectedFlight = null;
    },
  },
});

// Exportujemo akcije
export const { selectFlight, clearFlight } = flightSlice.actions;

// Exportujemo reducer
export default flightSlice.reducer;