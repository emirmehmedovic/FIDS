'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('flight_numbers', {
      id: { // Dodajemo standardni primarni ključ, iako ga model eksplicitno ne navodi
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      number: { // Kolona 'number' iz modela
        type: Sequelize.STRING,
        allowNull: false
      },
      destination: { // Kolona 'destination' iz modela (STRING)
        type: Sequelize.STRING,
        allowNull: false
      },
      is_departure: { // Kolona 'is_departure' iz modela
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      createdAt: { // Dodajemo jer model ima timestamps: true
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: { // Dodajemo jer model ima timestamps: true
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Opcionalno: Dodaj indekse ako misliš da će poboljšati performanse upita
    // await queryInterface.addIndex('flight_numbers', ['number']);
    // await queryInterface.addIndex('flight_numbers', ['destination']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('flight_numbers');
  }
};