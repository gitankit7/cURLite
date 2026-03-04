import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const app = express();
// Configure API server port
// Can be set via API_PORT env var, or defaults to PORT + 1, or 2402
const API_PORT = parseInt(process.env.API_PORT || process.env.PORT ? (parseInt(process.env.PORT) + 1) : '2402', 10);

// --- File-based storage ---
// Stores data in  curlite/data/services.json
// Delete that file (or the whole data/ folder) any time to reset.
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DATA_FILE = join(DATA_DIR, 'services.json');

function readData() {
  try {
    if (!existsSync(DATA_FILE)) return null;
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function writeData(data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// --- Storage API ---

/** GET /api/data — read all services */
app.get('/api/data', (req, res) => {
  const data = readData();
  res.json({ services: data });
});

/** PUT /api/data — overwrite all services */
app.put('/api/data', (req, res) => {
  const { services } = req.body;
  if (!Array.isArray(services)) {
    return res.status(400).json({ error: 'services must be an array' });
  }
  writeData(services);
  res.json({ ok: true });
});

/**
 * POST /api/execute
 *
 * Executes a curl command on the server and returns stdout + stderr.
 * This avoids CORS issues since curl runs natively on the host.
 *
 * Body: { method, url, headers: { key: value }, body?: string, verbose?: boolean }
 *
 * ⚠️  This endpoint runs shell commands — in production you'd want
 *     input sanitization and rate limiting. Fine for local dev use.
 */
app.post('/api/execute', async (req, res) => {
  const { method, url, headers = {}, body, verbose = true } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Build the curl command
  let cmd = 'curl -s'; // silent progress bar
  if (verbose) cmd += ' -v';
  cmd += ` -X ${method || 'GET'}`;
  cmd += ' -w "\\n__HTTP_CODE:%{http_code}__TIME:%{time_total}"';

  for (const [key, value] of Object.entries(headers)) {
    if (key.trim()) {
      // Escape single quotes in header values
      const safeVal = `${key}: ${value}`.replace(/'/g, "'\\''");
      cmd += ` -H '${safeVal}'`;
    }
  }

  if (body && !['GET', 'HEAD', 'DELETE'].includes(method)) {
    const safeBody = body.replace(/'/g, "'\\''");
    cmd += ` -d '${safeBody}'`;
  }

  // Escape the URL
  const safeUrl = url.replace(/'/g, "'\\''");
  cmd += ` '${safeUrl}'`;

  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 30000, // 30s timeout
      maxBuffer: 5 * 1024 * 1024, // 5MB
    });

    const elapsed = Date.now() - startTime;

    // Parse the http code and time from the -w format string
    let httpCode = 0;
    let curlTime = 0;
    let responseBody = stdout;

    const metaMatch = stdout.match(/__HTTP_CODE:(\d+)__TIME:([\d.]+)$/);
    if (metaMatch) {
      httpCode = parseInt(metaMatch[1], 10);
      curlTime = parseFloat(metaMatch[2]);
      responseBody = stdout.slice(0, metaMatch.index);
    }

    res.json({
      status: httpCode,
      time: Math.round(curlTime * 1000) || elapsed,
      body: responseBody,
      stderr: verbose ? stderr : '',
      error: null,
    });
  } catch (err) {
    res.json({
      status: 0,
      time: Date.now() - startTime,
      body: '',
      stderr: err.stderr || '',
      error: err.message || 'curl execution failed',
    });
  }
});

/** Health check */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(API_PORT, () => {
  console.log(`\n  🚀 cURLite API Server Started`);
  console.log(`  ✅ Running at: http://localhost:${API_PORT}`);
  console.log(`  📁 Data file: ${DATA_FILE}`);
  console.log(`  ⚙️  Port configured via: ${process.env.API_PORT ? 'API_PORT env var' : process.env.PORT ? 'PORT env var (+1)' : 'default'}`);
  console.log(`  📡 Available endpoints:`);
  console.log(`     GET  /api/data     — read services`);
  console.log(`     PUT  /api/data     — save services`);
  console.log(`     POST /api/execute  — run a curl command`);
  console.log(`     GET  /api/health   — health check`);
  console.log(`  💡 Set API_PORT environment variable to customize port\n`);
});
