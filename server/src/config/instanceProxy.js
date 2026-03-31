const http = require('http');
const net = require('net');
const prisma = require('./database');

// Cache port lookups for 10 seconds to avoid hammering the DB
const portCache = new Map(); // subdomain -> { port, expires }

async function resolvePort(host) {
  const subdomain = host.split(':')[0]; // strip port if any
  const now = Date.now();

  if (portCache.has(subdomain)) {
    const cached = portCache.get(subdomain);
    if (cached.expires > now) return cached.port;
  }

  const instance = await prisma.instance.findFirst({
    where: { subdomain, status: 'running' },
    select: { port: true },
  });

  if (!instance) return null;

  portCache.set(subdomain, { port: instance.port, expires: now + 10000 });
  return instance.port;
}

const proxyServer = http.createServer(async (req, res) => {
  const host = req.headers.host || '';

  try {
    const port = await resolvePort(host);

    if (!port) {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      res.end('<h2>Instance not found or not running</h2><p>Make sure the instance is started from your LogicAI dashboard.</p>');
      return;
    }

    const options = {
      hostname: '127.0.0.1',
      port,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${port}` },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502);
        res.end('Bad Gateway – container unreachable');
      }
    });

    req.pipe(proxyReq, { end: true });
  } catch (err) {
    console.error('[InstanceProxy] Error:', err.message);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Internal proxy error');
    }
  }
});

// WebSocket proxy (n8n relies on WS for its UI)
proxyServer.on('upgrade', async (req, socket, head) => {
  const host = req.headers.host || '';

  try {
    const port = await resolvePort(host);

    if (!port) {
      socket.destroy();
      return;
    }

    const conn = net.connect(port, '127.0.0.1', () => {
      // Forward the upgrade request manually
      let upgradeHeader = `GET ${req.url} HTTP/1.1\r\n`;
      Object.entries(req.headers).forEach(([k, v]) => {
        upgradeHeader += `${k}: ${v}\r\n`;
      });
      upgradeHeader += '\r\n';

      conn.write(upgradeHeader);
      if (head && head.length) conn.write(head);

      conn.pipe(socket, { end: true });
      socket.pipe(conn, { end: true });
    });

    conn.on('error', () => socket.destroy());
    socket.on('error', () => conn.destroy());
  } catch (err) {
    socket.destroy();
  }
});

function startInstanceProxy(port = 3001) {
  proxyServer.listen(port, '127.0.0.1', () => {
    console.log(`[InstanceProxy] Subdomain proxy listening on 127.0.0.1:${port}`);
  });
}

module.exports = { startInstanceProxy };
