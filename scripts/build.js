'use strict';
/* "Production build" for the static site: verifies the sources, then copies the public files to dist/.
   Dev-only files (server.js, tests/, scripts/) are not copied. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const out = path.join(root, 'dist');

// 1. every script parses, content integrity holds
function walk(dir, acc) { fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, acc); else acc.push(p); }); return acc; }
walk(path.join(root, 'assets', 'js'), []).filter((f) => f.endsWith('.js') && !f.includes('vendor')).forEach((f) => execFileSync(process.execPath, ['--check', f]));
['server.js'].forEach((f) => execFileSync(process.execPath, ['--check', path.join(root, f)]));
execFileSync(process.execPath, [path.join(root, 'tests', 'data.test.js')], { stdio: 'inherit' });

// 2. every local asset referenced by index.html exists
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const refs = (html.match(/(?:src|href)="(assets\/[^"#?]+)"/g) || []).map((m) => m.replace(/^(?:src|href)="/, '').replace(/"$/, ''));
const missing = refs.filter((r) => !fs.existsSync(path.join(root, r)));
if (missing.length) { console.error('Missing assets:', missing); process.exit(1); }

// 3. copy public files
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(path.join(root, 'index.html'), path.join(out, 'index.html'));
fs.copyFileSync(path.join(root, '.nojekyll'), path.join(out, '.nojekyll'));
fs.cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
console.log('build ok: ' + walk(out, []).length + ' files in dist/ (' + refs.length + ' referenced assets verified)');
