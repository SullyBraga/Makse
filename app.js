process.env.NODE_ENV = 'production';

const path = require('path');
const http = require('http');
const fs = require('fs');
const { parse } = require('url');

const STATIC_DIR = path.join(__dirname, '.next', 'standalone', '.next', 'static');
const PUBLIC_DIR = path.join(__dirname, '.next', 'standalone', 'public');

const MIME = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
};

function serveStatic(res, filePath) {
    if (!fs.existsSync(filePath)) return false;
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
    });
    fs.createReadStream(filePath).pipe(res);
    return true;
}

// Inicia o servidor Next.js standalone na porta 3001 (interno)
process.env.PORT = '3001';
const dir = path.join(__dirname, '.next', 'standalone');
process.chdir(dir);
require(path.join(dir, 'server.js'));

// Proxy + static server na porta 3000 (que a Hostinger expõe)
const { createProxyServer } = require('http-proxy');
const proxy = createProxyServer({ target: 'http://localhost:3001' });

http.createServer((req, res) => {
    const { pathname } = parse(req.url || '/');

    // Serve /_next/static/
    if (pathname.startsWith('/_next/static/')) {
        const rel = pathname.replace('/_next/static/', '');
        const filePath = path.join(STATIC_DIR, rel);
        if (serveStatic(res, filePath)) return;
    }

    // Serve /public/
    if (!pathname.startsWith('/_next/')) {
        const filePath = path.join(PUBLIC_DIR, pathname);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            if (serveStatic(res, filePath)) return;
        }
    }

    // Tudo o resto vai pro Next
    proxy.web(req, res);
}).listen(3000, () => {
    console.log('> Server ready on port 3000');
});