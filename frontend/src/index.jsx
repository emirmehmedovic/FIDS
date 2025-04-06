// Import polyfills first
import './polyfills';

import React from 'react';
import ReactDOM from 'react-dom/client'; // Import createRoot from react-dom/client
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap first
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import store from './store/store'; // Redux store
import { AuthProvider } from './components/AuthProvider'; // Import AuthProvider

// Get the root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Create a root
const root = ReactDOM.createRoot(rootElement);

// Render the app using the new API and StrictMode
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider> {/* Wrap App with AuthProvider */}
        <App />
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
