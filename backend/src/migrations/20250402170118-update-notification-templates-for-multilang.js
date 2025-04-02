'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Removed transaction wrapper to handle errors individually

      // Add columns individually, ignoring "already exists" errors
      try {
        await queryInterface.addColumn('notification_templates', 'name', {
          type: Sequelize.STRING,
          allowNull: true, // Allow NULL
          unique: true,
          comment: 'Internal name/identifier for the template (e.g., "Delay - Weather")',
        });
        console.log("Column 'name' added or already exists.");
      } catch (error) {
        // Check if error indicates column already exists (Postgres code '42701')
        if (error.original?.code === '42701' || error.message.includes('already exists')) {
          console.warn("Column 'name' already exists, skipping addColumn.");
        } else {
          console.error("Error adding 'name' column:", error);
          throw error; // Re-throw other errors
        }
      }

      // Add other language columns (these can be added directly as they allow NULL)
      try {
        await queryInterface.addColumn('notification_templates', 'text_bs', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Template text in Bosnian with placeholders',
        });
         console.log("Column 'text_bs' added or already exists.");
      } catch (error) {
         if (error.original?.code === '42701' || error.message.includes('already exists')) {
           console.warn("Column 'text_bs' already exists, skipping addColumn.");
         } else { console.error("Error adding 'text_bs' column:", error); throw error; }
      }

      try {
        await queryInterface.addColumn('notification_templates', 'text_en', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Template text in English with placeholders',
        });
         console.log("Column 'text_en' added or already exists.");
      } catch (error) {
         if (error.original?.code === '42701' || error.message.includes('already exists')) {
           console.warn("Column 'text_en' already exists, skipping addColumn.");
         } else { console.error("Error adding 'text_en' column:", error); throw error; }
      }

      try {
        await queryInterface.addColumn('notification_templates', 'text_de', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Template text in German with placeholders',
        });
         console.log("Column 'text_de' added or already exists.");
      } catch (error) {
         if (error.original?.code === '42701' || error.message.includes('already exists')) {
           console.warn("Column 'text_de' already exists, skipping addColumn.");
         } else { console.error("Error adding 'text_de' column:", error); throw error; }
      }

      try {
        await queryInterface.addColumn('notification_templates', 'text_tr', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Template text in Turkish with placeholders',
        });
         console.log("Column 'text_tr' added or already exists.");
      } catch (error) {
         if (error.original?.code === '42701' || error.message.includes('already exists')) {
           console.warn("Column 'text_tr' already exists, skipping addColumn.");
         } else { console.error("Error adding 'text_tr' column:", error); throw error; }
      }


      // Remove the old 'text' column (only if it exists)
      try {
          await queryInterface.removeColumn('notification_templates', 'text');
          console.log("Column 'text' removed or did not exist.");
      } catch (error) {
          // Ignore error if column doesn't exist (Postgres code '42703')
          if (error.original?.code === '42703' || error.message.includes('does not exist')) {
             console.warn("Column 'text' does not exist, skipping removeColumn.");
          } else {
             console.error("Error removing 'text' column:", error);
             throw error; // Re-throw other errors
          }
      }
  },

  async down (queryInterface, Sequelize) {
    // Reverting requires careful steps in reverse order
    // Using individual try/catch here too for robustness

       try { await queryInterface.removeColumn('notification_templates', 'text_bs'); console.log("Column 'text_bs' removed."); } catch (e) { console.warn("Error removing text_bs:", e.message); }
       try { await queryInterface.removeColumn('notification_templates', 'text_en'); console.log("Column 'text_en' removed."); } catch (e) { console.warn("Error removing text_en:", e.message); }
       try { await queryInterface.removeColumn('notification_templates', 'text_de'); console.log("Column 'text_de' removed."); } catch (e) { console.warn("Error removing text_de:", e.message); }
       try { await queryInterface.removeColumn('notification_templates', 'text_tr'); console.log("Column 'text_tr' removed."); } catch (e) { console.warn("Error removing text_tr:", e.message); }
       try { await queryInterface.removeColumn('notification_templates', 'name'); console.log("Column 'name' removed."); } catch (e) { console.warn("Error removing name:", e.message); }

       // Add the old 'text' column back (if it doesn't exist)
       try {
           await queryInterface.addColumn('notification_templates', 'text', {
             type: Sequelize.TEXT,
             allowNull: true, // Make it nullable initially
           });
           console.log("Column 'text' added back.");
       } catch (error) {
            // Check if error indicates column already exists (Postgres code '42701')
            if (error.original?.code === '42701' || error.message.includes('already exists')) {
               console.warn("Column 'text' already exists, skipping addColumn in down migration.");
            } else {
               console.warn("Could not add back 'text' column.", error.message);
               // Decide if this should throw or just warn
            }
       }
  }
};
