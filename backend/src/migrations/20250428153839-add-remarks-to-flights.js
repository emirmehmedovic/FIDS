'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Dodaje kolonu 'remarks' u tabelu 'flights'
    await queryInterface.addColumn('flights', 'remarks', {
      type: Sequelize.STRING, // Tip podatka STRING (VARCHAR). Možeš koristiti Sequelize.TEXT ako trebaš duži tekst.
      allowNull: true       // Dozvoljava NULL vrijednosti, kao što je definirano u modelu.
    });
  },

  async down (queryInterface, Sequelize) {
    // Uklanja kolonu 'remarks' iz tabele 'flights' ako se migracija poništava
    await queryInterface.removeColumn('flights', 'remarks');
  }
};