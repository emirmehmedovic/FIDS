// Import polyfills first
import './polyfills';

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap prvi
import './index.css';
import ReactDOM from 'react-dom'; // Use 'react-dom' instead of 'react-dom/client'
import App from './App';
import { Provider } from 'react-redux';
import store from './store/store'; // Redux store
import { AuthProvider } from './components/AuthProvider'; // Import AuthProvider

ReactDOM.render(
  <Provider store={store}>
    <AuthProvider> {/* Wrap App with AuthProvider */}
      <App />
    </AuthProvider>
  </Provider>,
  document.getElementById('root')
);
