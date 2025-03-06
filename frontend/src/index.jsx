// Import polyfills first
import './polyfills';

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap prvi
import './index.css'; 
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './store/store'; // Redux store




const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
