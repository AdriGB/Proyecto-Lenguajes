#!/usr/bin/env node
/**
 * Master Test Runner for Fullstack Academic Portfolio (Proyecto L)
 * Zero-dependency native Node.js v24 runner
 */
const path = require('node:path');
const fs = require('node:fs');
const { harness, colors } = require('./helpers/test-harness');
const api = require('./helpers/api');
const db = require('./helpers/db');
const config = require('./helpers/config');
const serverManager = require('./helpers/server-manager');

// Clean cleanup on process signals
process.on('SIGINT', () => {
  serverManager.stopServer();
  process.exit(130);
});
process.on('SIGTERM', () => {
  serverManager.stopServer();
  process.exit(143);
});

// Parse Command Line Arguments
const args = process.argv.slice(2);
const options = {
  tier: null,
  filter: null,
  dbOnly: false,
  apiOnly: false,
  help: false
};

for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    options.tier = arg.split('=')[1].trim();
  } else if (arg.startsWith('--filter=')) {
    options.filter = arg.split('=')[1].trim();
  } else if (arg === '--db-only') {
    options.dbOnly = true;
  } else if (arg === '--api-only') {
    options.apiOnly = true;
  } else if (arg === '--help' || arg === '-h') {
    options.help = true;
  }
}

if (options.help) {
  console.log(`
Usage: node tests/runner.js [options]

Options:
  --tier=<0|1|2|3|4|all>   Execute specific test tier (default: all)
  --filter=<keyword>       Filter suites or tests by keyword
  --db-only                Execute direct SQLite database tests only
  --api-only               Execute HTTP API tests only
  --help, -h               Show this help message

Environment Variables:
  TEST_API_URL             Backend API base URL (default: http://localhost:5000)
  TEST_DB_PATH             Path to SQLite database file
  VERBOSE                  Enable detailed debugging output (true/false)
`);
  process.exit(0);
}

// Suites registry
const suitesByTier = {
  '0': [
    path.join(__dirname, 'tier0-database/database.test.js')
  ],
  '1': [
    path.join(__dirname, 'tier1-feature-coverage/health.test.js'),
    path.join(__dirname, 'tier1-feature-coverage/auth.test.js'),
    path.join(__dirname, 'tier1-feature-coverage/projects.test.js'),
    path.join(__dirname, 'tier1-feature-coverage/services.test.js'),
    path.join(__dirname, 'tier1-feature-coverage/contact.test.js'),
    path.join(__dirname, 'tier1-feature-coverage/operator.test.js'),
    path.join(__dirname, 'tier1-feature-coverage/admin-metrics.test.js')
  ],
  '2': [
    path.join(__dirname, 'tier2-boundary-corner/validation-boundaries.test.js'),
    path.join(__dirname, 'tier2-boundary-corner/security-escalation.test.js'),
    path.join(__dirname, 'tier2-boundary-corner/edge-cases.test.js')
  ],
  '3': [
    path.join(__dirname, 'tier3-cross-feature/inquiry-lifecycle.test.js'),
    path.join(__dirname, 'tier3-cross-feature/project-lifecycle.test.js'),
    path.join(__dirname, 'tier3-cross-feature/user-cascade.test.js'),
    path.join(__dirname, 'tier3-cross-feature/role-promotion.test.js'),
    path.join(__dirname, 'tier3-cross-feature/metrics-flow.test.js')
  ],
  '4': [
    path.join(__dirname, 'tier4-real-world/visitor-journey.test.js'),
    path.join(__dirname, 'tier4-real-world/admin-operator-journey.test.js')
  ],
  '5': [
    path.join(__dirname, 'tier5-adversarial/backend-hardening.test.js')
  ]
};

async function main() {
  console.log(`${colors.bold}${colors.cyan}Initializing E2E Test Suite...${colors.reset}`);
  console.log(`Node Version:    ${process.version}`);
  console.log(`Target API URL:  ${config.apiUrl}`);
  console.log(`Database Path:   ${db.getDbPath()}`);

  // Determine tiers to execute
  let tiersToRun = ['0', '1', '2', '3', '4', '5'];
  if (options.dbOnly) {
    tiersToRun = ['0'];
  } else if (options.apiOnly) {
    tiersToRun = ['1', '2', '3', '4', '5'];
  } else if (options.tier && options.tier !== 'all') {
    tiersToRun = [options.tier];
  } else if (options.tier === 'all') {
    tiersToRun = ['0', '1', '2', '3', '4', '5'];
  }

  // If running API tiers, attempt auto-starting server if needed
  const runsApiTiers = tiersToRun.some(t => t !== '0');
  if (runsApiTiers) {
    await serverManager.ensureServerRunning();
  }

  // Probe environment readiness
  const isServerUp = await api.isServerReachable();
  const isDbPresent = db.isAvailable();

  console.log(`Backend Server:  ${isServerUp ? colors.green + 'ONLINE (200 OK)' : colors.yellow + 'OFFLINE / NOT REACHABLE'}${colors.reset}`);
  console.log(`SQLite Database: ${isDbPresent ? colors.green + 'FOUND' : colors.yellow + 'NOT FOUND / PENDING MIGRATION'}${colors.reset}`);

  // Load requested test files
  const filesToExecute = [];
  for (const t of tiersToRun) {
    if (suitesByTier[t]) {
      filesToExecute.push(...suitesByTier[t]);
    }
  }

  if (filesToExecute.length === 0) {
    console.error(`${colors.red}Error: No test files found for tier: ${options.tier}${colors.reset}`);
    process.exit(1);
  }

  console.log(`\nLoading ${filesToExecute.length} test suite(s)...`);

  for (const file of filesToExecute) {
    if (fs.existsSync(file)) {
      try {
        require(file);
      } catch (err) {
        console.error(`${colors.red}Failed to load test suite ${file}: ${err.message}${colors.reset}`);
      }
    } else {
      console.warn(`${colors.yellow}Warning: File does not exist: ${file}${colors.reset}`);
    }
  }

  // If server is offline and we are running API tiers, advise user
  if (!isServerUp && runsApiTiers) {
    console.log(`\n${colors.yellow}${colors.bold}⚠ NOTICE: Backend server is offline at ${config.apiUrl}.${colors.reset}`);
    console.log(`${colors.yellow}API tests will attempt HTTP requests and may fail until backend server is running.${colors.reset}`);
    console.log(`${colors.gray}To launch backend before running tests:${colors.reset}`);
    console.log(`${colors.gray}  cd backend && npm start (or node src/server.js)${colors.reset}\n`);
  }

  let passed = false;
  try {
    passed = await harness.run(options.filter);
  } finally {
    serverManager.stopServer();
  }

  if (!passed) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch(err => {
  serverManager.stopServer();
  console.error(`\n${colors.red}${colors.bold}Fatal Test Runner Error:${colors.reset}`, err);
  process.exit(1);
});
