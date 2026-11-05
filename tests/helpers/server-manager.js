/**
 * Backend Server Auto-Launcher for Test Runs
 * Checks if backend server is running; if not, attempts to spawn it from backend source.
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const api = require('./api');
const config = require('./config');

const BACKEND_ENTRYPOINTS = [
  path.resolve(__dirname, '../../backend/src/server.js'),
  path.resolve(__dirname, '../../backend/server.js'),
  path.resolve(__dirname, '../../backend/src/app.js')
];

class ServerManager {
  constructor() {
    this.process = null;
    this.spawnedByTests = false;
  }

  findBackendEntrypoint() {
    for (const ep of BACKEND_ENTRYPOINTS) {
      if (fs.existsSync(ep)) return ep;
    }
    return null;
  }

  async ensureServerRunning(maxWaitMs = 6000) {
    // 1. Check if already running
    if (await api.isServerReachable()) {
      return { started: true, spawned: false, entrypoint: null };
    }

    // 2. Check if entrypoint file exists
    const entrypoint = this.findBackendEntrypoint();
    if (!entrypoint) {
      return { started: false, spawned: false, entrypoint: null, reason: 'Backend entrypoint not found' };
    }

    // 3. Spawn server in backend directory
    const backendCwd = path.dirname(path.dirname(entrypoint));
    console.log(`[TEST HARNESS] Auto-starting backend server: ${entrypoint}`);
    
    this.process = spawn(process.execPath, [entrypoint], {
      cwd: backendCwd,
      env: {
        ...process.env,
        PORT: '5000',
        NODE_ENV: 'test'
      },
      stdio: config.verbose ? 'inherit' : 'ignore'
    });
    this.spawnedByTests = true;

    // 4. Poll health endpoint until ready
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(r => setTimeout(r, 250));
      if (await api.isServerReachable()) {
        console.log(`[TEST HARNESS] Backend server successfully started and responding at ${config.apiUrl}`);
        return { started: true, spawned: true, entrypoint };
      }
      if (this.process.exitCode !== null) {
        return { started: false, spawned: true, entrypoint, reason: `Server exited with code ${this.process.exitCode}` };
      }
    }

    return { started: false, spawned: true, entrypoint, reason: `Server startup timed out after ${maxWaitMs}ms` };
  }

  stopServer() {
    if (this.process && this.spawnedByTests) {
      console.log(`[TEST HARNESS] Stopping auto-spawned backend server (PID: ${this.process.pid})...`);
      try {
        this.process.kill('SIGTERM');
      } catch {}
      this.process = null;
    }
  }
}

module.exports = new ServerManager();
