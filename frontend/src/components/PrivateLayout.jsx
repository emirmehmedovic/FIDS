// frontend/src/components/PrivateLayout.jsx
import React from 'react';
import Sidebar from './Sidebar'; // Pretpostavljamo da ste već implementirali Sidebar
import Navbar from './Navbar'; // Pretpostavljamo da ste već implementirali Navbar

const PrivateLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="content-container">
        <Navbar />
        <main>{children}</main>
      </div>
    </div>
  );
};

export default PrivateLayout;