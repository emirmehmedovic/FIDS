// frontend/src/components/PrivateLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';

const PrivateLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="content-container">
        <main>{children}</main>
      </div>
    </div>
  );
};

export default PrivateLayout;
