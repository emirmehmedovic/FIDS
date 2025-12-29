// Script to update airline_code for flight_numbers based on flight number prefix
// Usage: node scripts/update-flight-number-airlines.js

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

async function updateFlightNumberAirlines() {
  try {
    console.log('🚀 Starting flight number airline update...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    let totalUpdated = 0;
    const results = [];

    // Process each airline mapping
    for (const mapping of airlineMappings) {
      console.log(`Processing: ${mapping.prefix}* → ${mapping.airline_code} (${mapping.name})`);

      // Find all flight numbers that start with this prefix and have null or empty airline_code
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

      let updated = 0;
      let skipped = 0;

      // Update each flight number
      for (const flightNumber of flightNumbers) {
        // Check if airline_code is already set correctly
        if (flightNumber.airline_code === mapping.airline_code) {
          skipped++;
          continue;
        }

        // Update the airline_code
        await flightNumber.update({
          airline_code: mapping.airline_code
        });

        updated++;
        console.log(`  ✓ Updated: ${flightNumber.number} → ${mapping.airline_code}`);
      }

      totalUpdated += updated;

      const summary = {
        prefix: mapping.prefix,
        airline: mapping.name,
        code: mapping.airline_code,
        total: flightNumbers.length,
        updated: updated,
        skipped: skipped
      };

      results.push(summary);

      console.log(`  📊 Summary: ${updated} updated, ${skipped} already correct\n`);
    }

    // Print final summary
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 FINAL SUMMARY');
    console.log('═══════════════════════════════════════════════════');

    results.forEach(result => {
      console.log(`\n${result.prefix}* → ${result.code} (${result.airline})`);
      console.log(`  Total found: ${result.total}`);
      console.log(`  Updated: ${result.updated}`);
      console.log(`  Already correct: ${result.skipped}`);
    });

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`✅ TOTAL UPDATED: ${totalUpdated} flight numbers`);
    console.log('═══════════════════════════════════════════════════\n');

    // List any flight numbers that still don't have an airline_code
    const unmapped = await FlightNumber.findAll({
      where: {
        airline_code: null
      }
    });

    if (unmapped.length > 0) {
      console.log('⚠️  Flight numbers without airline mapping:');
      unmapped.forEach(fn => {
        console.log(`  - ${fn.number} (${fn.destination})`);
      });
      console.log('');
    }

    await sequelize.close();
    console.log('✅ Script completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error updating flight number airlines:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the script
updateFlightNumberAirlines();
