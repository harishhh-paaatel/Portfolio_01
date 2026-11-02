'use strict';
/* Tiny static server for local development: node server.js  ->  http://localhost:3000
   (GitHub Pages serves the production site; there is no backend.) */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BLOCKED = /^\/(scripts|tests|dist|node_modules|\.git)(\/|$)|^\/(server\.js|package\.json|package-lock\.json)$/i;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.ico': 'image/x-icon' };

http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch (e) { res.statusCode = 400; return res.end('Bad request'); }
  if (BLOCKED.test(rel)) { res.statusCode = 404; return res.end('Not found'); }
  let file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end('Forbidden'); }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (e2, buf) => {
      if (e2) { res.statusCode = 404; return res.end('Not found'); }
      res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
      res.end(buf);
    });
  });
}).listen(Number(process.env.PORT) || 3000, () => console.log('http://localhost:' + (process.env.PORT || 3000)));
