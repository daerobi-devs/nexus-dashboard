import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb } from './server/db.mjs';
import { handleApiRequest } from './server/api_router.mjs';
import { ensurePostgresDatabaseAndSync } from './server/pg_sync.mjs';
import {
  startTelegramPolling,
  startGoogleWorkspaceAutoSync,
} from './server/integrations.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DIST_DIR = path.resolve(__dirname, 'dist');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
};

// Initialize database & background engines
console.log('[Nexus Server] Initializing database and background engines...');
const dbPath = path.resolve(process.cwd(), 'data', 'nexus.db');
const isFreshLocalDb = !fs.existsSync(dbPath);
const db = initDb();

// Hydrate from PostgreSQL on fresh container boot before starting background tasks
await ensurePostgresDatabaseAndSync(db, { preferPullIfFresh: isFreshLocalDb }).catch((err) => {
  console.warn('[Nexus Server] Initial PostgreSQL sync notice:', err?.message);
});

// Start background services
startTelegramPolling(db);
startGoogleWorkspaceAutoSync(db, 150000);

// Helper to serve a static file from disk
function serveStaticFile(filePath, res) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Cache headers: immutable for versioned assets, no-cache for index.html
    const isVersionedAsset = filePath.includes(path.sep + 'assets' + path.sep);
    const cacheHeader = isVersionedAsset
      ? 'public, max-age=31536000, immutable'
      : 'no-cache';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', cacheHeader);

    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    // 1. API Endpoints
    if (req.url && req.url.startsWith('/api/')) {
      const handled = await handleApiRequest(req, res, db);
      if (handled) return;
    }

    // 2. Static File Serving from dist/
    const parsedUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
    let reqPath = decodeURIComponent(parsedUrl.pathname);
    if (reqPath === '/') reqPath = '/index.html';

    const safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
    const candidateFile = path.join(DIST_DIR, safePath);

    // If candidate file exists in dist, serve it
    if (serveStaticFile(candidateFile, res)) {
      return;
    }

    // 3. SPA Fallback: Serve index.html for client-side routing
    const indexHtml = path.join(DIST_DIR, 'index.html');
    if (serveStaticFile(indexHtml, res)) {
      return;
    }

    // 4. Fallback 404
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not Found');
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Nexus Server] Running at http://0.0.0.0:${PORT}`);
  console.log(`[Nexus Server] Serving static build from: ${DIST_DIR}`);
});

function handleShutdown(signal) {
  console.log(`\n[Nexus Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Nexus Server] HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
