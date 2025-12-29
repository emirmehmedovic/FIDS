// Script to fix destination names in flight_numbers table to match destinations table
const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Determine environment
const env = process.env.NODE_ENV || 'development';
console.log(`Initializing Sequelize for environment: ${env}`);

// Import config
const config = require('../src/config/config.js')[env];

// Initialize Sequelize
let sequelize;
if (config.use_env_variable) {
  const dbUrl = process.env[config.use_env_variable];
  if (!dbUrl) {
    throw new Error(`Environment variable "${config.use_env_variable}" is not set.`);
  }
  console.log(`Using DATABASE_URL from environment variable.`);
  sequelize = new Sequelize(dbUrl, config);
} else {
  console.log(`Using individual parameters from config.js for environment "${env}".`);
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Mapping of old names to new names
const destinationMapping = {
  'BASEL': 'Basel-Mulhouse',
  'COLOGNE': 'Köln Bonn',
  'FRANKFURT': 'Frankfurt-Hahn',
  'GOTHENBURG': 'Göteborg Landvetter',
  'GOT': 'Göteborg Landvetter',
  'MALMO': 'Malmö-Sturup',
  'PARIS': 'Paris Beauvais',
  'TZL': 'Vienna',
  'MEMMINGEN': 'Memmingen',
  'VIENNA': 'Vienna',
  'DORTMUND': 'Dortmund',
  'HAMBURG': 'Hamburg',
  'MAASTRICHT': 'Maastricht',
  'LARNACA': 'Larnaca',
  'BERLIN': 'Berlin',
  'Bratislava': 'Bratislava',
  'BGY': 'Milano Bergamo',
  'STN': 'London Stansted',
  'ANTALYA-FREEBIRD': 'Antalya',
  'ISTANBUL-AJET(VANREDNI)': 'Istanbul Sabiha Gokcen',
  'ISTANBUL-PEGASUS': 'Istanbul Sabiha Gokcen',
  'JEDDAH(FLYNAS)': 'Jeddah'
};

async function fixDestinationNames() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    console.log('🔄 Updating destination names in flight_numbers table...\n');

    for (const [oldName, newName] of Object.entries(destinationMapping)) {
      const [results] = await sequelize.query(
        `UPDATE flight_numbers SET destination = :newName WHERE destination = :oldName`,
        {
          replacements: { oldName, newName }
        }
      );

      if (results > 0) {
        console.log(`  ✓ Updated ${results} records: "${oldName}" → "${newName}"`);
      }
    }

    console.log('\n✅ All destination names updated successfully!');
    
    // Show summary
    const [flightNumbers] = await sequelize.query(
      `SELECT DISTINCT destination FROM flight_numbers ORDER BY destination`
    );
    
    console.log('\n📋 Current unique destinations in flight_numbers:');
    flightNumbers.forEach(fn => console.log(`  - ${fn.destination}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDestinationNames();

