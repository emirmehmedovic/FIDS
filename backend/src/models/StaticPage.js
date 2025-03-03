// models/StaticPage.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StaticPage = sequelize.define('StaticPage', {
    pageId: { // Dodajte ovo polje ako već ne postoji
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pageType: {
      type: DataTypes.ENUM('check-in', 'boarding', 'general'),
      allowNull: false,
      defaultValue: 'general'
    },
  }, {
    tableName: 'static_pages',
    timestamps: false,
  });

module.exports = StaticPage;