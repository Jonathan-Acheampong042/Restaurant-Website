// Ember & Olive: Unified Backend Test Runner
// Runs Validation, Database, and HTTP API integration suites

import { runValidationTests } from './validation.test.ts';
import { runDbTests } from './db.test.ts';
import { runApiTests } from './api.test.ts';

async function main() {
  console.log('====================================================');
  console.log('  Ember & Olive — Backend Test Runner');
  console.log('====================================================\n');

  const startTime = Date.now();

  const valResults = runValidationTests();
  console.log('');

  const dbResults = runDbTests();
  console.log('');

  const apiResults = await runApiTests();
  console.log('');

  const totalPassed = valResults.passed + dbResults.passed + apiResults.passed;
  const totalFailed = valResults.failed + dbResults.failed + apiResults.failed;
  const durationMs = Date.now() - startTime;

  console.log('====================================================');
  console.log('  Test Summary');
  console.log('====================================================');
  console.log(`  Validation Suite : ${valResults.passed} passed, ${valResults.failed} failed`);
  console.log(`  Database Suite   : ${dbResults.passed} passed, ${dbResults.failed} failed`);
  console.log(`  API Suite        : ${apiResults.passed} passed, ${apiResults.failed} failed`);
  console.log('----------------------------------------------------');
  console.log(`  Total: ${totalPassed} passed, ${totalFailed} failed (${durationMs}ms)`);
  console.log('====================================================\n');

  if (totalFailed > 0) {
    process.exitCode = 1;
  }
}

main();
