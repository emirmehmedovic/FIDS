// Preview script - shows what would be updated without making changes
// Usage: node scripts/preview-flight-number-airlines.js

const sequelize = require('../src/config/db');
const FlightNumber = require('../src/models/FlightNumber');

// Mapping of flight number prefixes to airline IATA codes
const airlineMappings = [
  { prefix: 'W4', airline_code: 'W6', name: 'Wizz Air' },
  { prefix: 'W6', airline_code: 'W6', name: 'Wizz Air' },
  { prefix: 'VF', airline_code: 'VF', name: 'Ajet' },
  { prefix: 'PC', airline_code: 'PC', name: 'Pegasus Airlines' },
  { prefix: 'FR', airline_code: 'FR', name: 'Ryanair' },
  { prefix: 'RK', airline_code: 'RK', name: 'Ryanair UK' },
  { prefix: 'CAI', airline_code: 'XC', name: 'Corendon Airlines' },
  { prefix: 'FH', airline_code: 'FH', name: 'Freebird Airlines' },
  { prefix: 'FHY', airline_code: 'FH', name: 'Freebird Airlines' },
  { prefix: 'XY', airline_code: 'XY', name: 'Flynas' }
];

async function previewFlightNumberAirlines() {
  try {
    console.log('👁️  DRY RUN - Preview mode (no changes will be made)\n');
    console.log('🚀 Analyzing flight number airline mappings...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    let totalWouldUpdate = 0;
    const results = [];

    // Process each airline mapping
    for (const mapping of airlineMappings) {
      console.log(`Analyzing: ${mapping.prefix}* → ${mapping.airline_code} (${mapping.name})`);

      // Find all flight numbers that start with this prefix
      const flightNumbers = await FlightNumber.findAll({
        where: {
          number: {
            [sequelize.Sequelize.Op.like]: `${mapping.prefix}%`
          }
        }
      });

      if (flightNumbers.length === 0) {
        console.log(`  ⚠️  No flight numbers found with prefix ${mapping.prefix}\n`);
        continue;
      }

      let wouldUpdate = 0;
      let alreadyCorrect = 0;

      // Analyze each flight number
      for (const flightNumber of flightNumbers) {
        if (flightNumber.airline_code === mapping.airline_code) {
          alreadyCorrect++;
        } else {
          wouldUpdate++;
          const currentCode = flightNumber.airline_code || '(null)';
          console.log(`  📝 Would update: ${flightNumber.number} | ${flightNumber.destination} | ${currentCode} → ${mapping.airline_code}`);
        }
      }

      totalWouldUpdate += wouldUpdate;

      const summary = {
        prefix: mapping.prefix,
        airline: mapping.name,
        code: mapping.airline_code,
        total: flightNumbers.length,
        wouldUpdate: wouldUpdate,
        alreadyCorrect: alreadyCorrect
      };

      results.push(summary);

      console.log(`  📊 Summary: ${wouldUpdate} would be updated, ${alreadyCorrect} already correct\n`);
    }

    // Print final summary
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 PREVIEW SUMMARY (DRY RUN)');
    console.log('═══════════════════════════════════════════════════');

    results.forEach(result => {
      console.log(`\n${result.prefix}* → ${result.code} (${result.airline})`);
      console.log(`  Total found: ${result.total}`);
      console.log(`  Would update: ${result.wouldUpdate}`);
      console.log(`  Already correct: ${result.alreadyCorrect}`);
    });

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`📝 TOTAL THAT WOULD BE UPDATED: ${totalWouldUpdate} flight numbers`);
    console.log('═══════════════════════════════════════════════════\n');

    // List any flight numbers that still don't have an airline_code
    const unmapped = await FlightNumber.findAll({
      where: {
        airline_code: null
      }
    });

    if (unmapped.length > 0) {
      console.log('⚠️  Flight numbers currently without airline mapping:');
      unmapped.forEach(fn => {
        console.log(`  - ${fn.number} (${fn.destination}) - ${fn.is_departure ? 'Odlazak' : 'Dolazak'}`);
      });
      console.log('');
    }

    console.log('💡 To apply these changes, run:');
    console.log('   node scripts/update-flight-number-airlines.js\n');

    await sequelize.close();
    console.log('✅ Preview completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error previewing flight number airlines:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the script
previewFlightNumberAirlines();
