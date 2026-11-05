/**
 * Lightweight Zero-Dependency Test Harness for Node.js 24
 * Provides BDD-style describe/it/expect with colored reporting and suite summary.
 */
const assert = require('node:assert/strict');

// ANSI Color Helpers with fallback detection
const useColors = !process.env.NO_COLOR && process.stdout.isTTY !== false;
const colors = {
  reset: useColors ? '\x1b[0m' : '',
  bold: useColors ? '\x1b[1m' : '',
  dim: useColors ? '\x1b[2m' : '',
  green: useColors ? '\x1b[32m' : '',
  red: useColors ? '\x1b[31m' : '',
  yellow: useColors ? '\x1b[33m' : '',
  cyan: useColors ? '\x1b[36m' : '',
  magenta: useColors ? '\x1b[35m' : '',
  gray: useColors ? '\x1b[90m' : ''
};

class Expectation {
  constructor(actual, isNot = false) {
    this.actual = actual;
    this.isNot = isNot;
  }

  get not() {
    return new Expectation(this.actual, !this.isNot);
  }

  toBe(expected) {
    const pass = Object.is(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be' : 'to be'} ${JSON.stringify(expected)}`);
    }
  }

  toEqual(expected) {
    try {
      assert.deepStrictEqual(this.actual, expected);
      if (this.isNot) {
        throw new Error(`Expected values NOT to deeply equal, but they did.`);
      }
    } catch (err) {
      if (!this.isNot) throw err;
    }
  }

  toBeDefined() {
    const pass = this.actual !== undefined;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected value ${this.isNot ? 'NOT to be defined' : 'to be defined'}, but got ${this.actual}`);
    }
  }

  toBeUndefined() {
    const pass = this.actual === undefined;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected value ${this.isNot ? 'NOT to be undefined' : 'to be undefined'}, but got ${this.actual}`);
    }
  }

  toBeNull() {
    const pass = this.actual === null;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be null' : 'to be null'}`);
    }
  }

  toBeTruthy() {
    const pass = Boolean(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be truthy' : 'to be truthy'}`);
    }
  }

  toBeFalsy() {
    const pass = !this.actual;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT to be falsy' : 'to be falsy'}`);
    }
  }

  toBeGreaterThan(val) {
    const pass = this.actual > val;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'NOT to be greater than' : 'to be greater than'} ${val}`);
    }
  }

  toBeLessThan(val) {
    const pass = this.actual < val;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'NOT to be less than' : 'to be less than'} ${val}`);
    }
  }

  toBeGreaterThanOrEqual(val) {
    const pass = this.actual >= val;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'NOT to be >=' : 'to be >='} ${val}`);
    }
  }

  toBeLessThanOrEqual(val) {
    const pass = this.actual <= val;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'NOT to be <=' : 'to be <='} ${val}`);
    }
  }

  toContain(item) {
    let pass = false;
    if (typeof this.actual === 'string') {
      pass = this.actual.includes(item);
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.includes(item) || this.actual.some(x => {
        try { assert.deepStrictEqual(x, item); return true; } catch { return false; }
      });
    }
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected collection ${this.isNot ? 'NOT to contain' : 'to contain'} ${JSON.stringify(item)}`);
    }
  }

  toMatch(regex) {
    const pass = regex.test(String(this.actual));
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected string "${this.actual}" ${this.isNot ? 'NOT to match' : 'to match'} pattern ${regex}`);
    }
  }

  toHaveProperty(prop) {
    const pass = this.actual && Object.prototype.hasOwnProperty.call(this.actual, prop);
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected object ${this.isNot ? 'NOT to have property' : 'to have property'} "${prop}"`);
    }
  }
}

function expect(actual) {
  return new Expectation(actual);
}

class TestSuiteRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.stats = {
      suitesTotal: 0,
      suitesPassed: 0,
      suitesFailed: 0,
      testsTotal: 0,
      testsPassed: 0,
      testsFailed: 0,
      testsSkipped: 0,
      startTime: 0,
      endTime: 0
    };
  }

  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      beforeAllFns: [],
      afterAllFns: [],
      beforeEachFns: [],
      afterEachFns: [],
      passed: true
    };
    this.suites.push(suite);
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  test(name, fn, options = {}) {
    if (!this.currentSuite) {
      throw new Error(`test("${name}") must be declared inside a describe() block`);
    }
    this.currentSuite.tests.push({
      name,
      fn,
      skip: options.skip || false,
      only: options.only || false
    });
  }

  it(name, fn, options) {
    this.test(name, fn, options);
  }

  beforeAll(fn) {
    if (this.currentSuite) this.currentSuite.beforeAllFns.push(fn);
  }

  afterAll(fn) {
    if (this.currentSuite) this.currentSuite.afterAllFns.push(fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEachFns.push(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEachFns.push(fn);
  }

  async run(filterKeyword = null) {
    this.stats.startTime = Date.now();
    console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}           E2E TEST RUNNER - Node.js v24            ${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

    for (const suite of this.suites) {
      if (filterKeyword && !suite.name.toLowerCase().includes(filterKeyword.toLowerCase())) {
        continue;
      }
      this.stats.suitesTotal++;
      console.log(`\n${colors.bold}${colors.magenta}▶ Suite: ${suite.name}${colors.reset}`);

      // Run beforeAll
      for (const beforeAllFn of suite.beforeAllFns) {
        try {
          await beforeAllFn();
        } catch (err) {
          console.error(`  ${colors.red}✖ beforeAll hook failed: ${err.message}${colors.reset}`);
          suite.passed = false;
        }
      }

      for (const t of suite.tests) {
        this.stats.testsTotal++;
        if (t.skip) {
          this.stats.testsSkipped++;
          console.log(`  ${colors.yellow}⚠ [SKIP] ${t.name}${colors.reset}`);
          continue;
        }

        // Run beforeEach
        for (const beforeEachFn of suite.beforeEachFns) {
          await beforeEachFn();
        }

        const testStart = Date.now();
        try {
          await t.fn();
          const duration = Date.now() - testStart;
          this.stats.testsPassed++;
          console.log(`  ${colors.green}✔ [PASS]${colors.reset} ${t.name} ${colors.gray}(${duration}ms)${colors.reset}`);
        } catch (err) {
          const duration = Date.now() - testStart;
          this.stats.testsFailed++;
          suite.passed = false;
          console.log(`  ${colors.red}✖ [FAIL]${colors.reset} ${t.name} ${colors.gray}(${duration}ms)${colors.reset}`);
          console.log(`    ${colors.red}${err.stack ? err.stack.split('\n').slice(0, 4).join('\n    ') : err.message}${colors.reset}`);
        }

        // Run afterEach
        for (const afterEachFn of suite.afterEachFns) {
          try {
            await afterEachFn();
          } catch (err) {
            console.error(`  ${colors.red}✖ afterEach hook failed: ${err.message}${colors.reset}`);
          }
        }
      }

      // Run afterAll
      for (const afterAllFn of suite.afterAllFns) {
        try {
          await afterAllFn();
        } catch (err) {
          console.error(`  ${colors.red}✖ afterAll hook failed: ${err.message}${colors.reset}`);
        }
      }

      if (suite.passed) {
        this.stats.suitesPassed++;
      } else {
        this.stats.suitesFailed++;
      }
    }

    this.stats.endTime = Date.now();
    this.printSummary();
    return this.stats.testsFailed === 0;
  }

  printSummary() {
    const totalTime = ((this.stats.endTime - this.stats.startTime) / 1000).toFixed(2);
    console.log(`\n${colors.bold}${colors.cyan}----------------------------------------------------${colors.reset}`);
    console.log(`${colors.bold}Test Execution Summary:${colors.reset}`);
    console.log(`  Suites:  ${this.stats.suitesPassed > 0 ? colors.green : ''}${this.stats.suitesPassed} passed${colors.reset}, ${this.stats.suitesFailed > 0 ? colors.red + this.stats.suitesFailed + ' failed' + colors.reset : '0 failed'}, ${this.stats.suitesTotal} total`);
    console.log(`  Tests:   ${this.stats.testsPassed > 0 ? colors.green : ''}${this.stats.testsPassed} passed${colors.reset}, ${this.stats.testsFailed > 0 ? colors.red + this.stats.testsFailed + ' failed' + colors.reset : '0 failed'}, ${this.stats.testsSkipped > 0 ? colors.yellow + this.stats.testsSkipped + ' skipped' + colors.reset : '0 skipped'}, ${this.stats.testsTotal} total`);
    console.log(`  Time:    ${totalTime}s`);
    
    if (this.stats.testsFailed === 0 && this.stats.testsTotal > 0) {
      console.log(`\n${colors.bold}${colors.green}✔ ALL TESTS PASSED SUCCESSFULLY!${colors.reset}`);
    } else if (this.stats.testsFailed > 0) {
      console.log(`\n${colors.bold}${colors.red}✖ SOME TESTS FAILED. Inspect output above.${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠ NO TESTS EXECUTED.${colors.reset}`);
    }
    console.log(`${colors.bold}${colors.cyan}----------------------------------------------------${colors.reset}\n`);
  }
}

// Global harness singleton
const harness = new TestSuiteRunner();

module.exports = {
  describe: (name, fn) => harness.describe(name, fn),
  test: (name, fn, options) => harness.test(name, fn, options),
  it: (name, fn, options) => harness.it(name, fn, options),
  beforeAll: (fn) => harness.beforeAll(fn),
  afterAll: (fn) => harness.afterAll(fn),
  beforeEach: (fn) => harness.beforeEach(fn),
  afterEach: (fn) => harness.afterEach(fn),
  expect,
  assert,
  harness,
  colors
};
