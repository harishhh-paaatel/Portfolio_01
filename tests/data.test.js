'use strict';
/* Content integrity: one registry, unique ids and titles, exactly four doors, one category per project. */
const assert = require('assert');
global.window = {};
require('../assets/js/data.js');
const P = window.PORTFOLIO;

const ids = P.projects.map((p) => p.id), titles = P.projects.map((p) => p.title.toLowerCase());
assert.strictEqual(P.categories.length, 4, 'exactly four doors');
assert.strictEqual(new Set(ids).size, ids.length, 'unique project ids');
assert.strictEqual(new Set(titles).size, titles.length, 'unique project titles');
const cats = new Set(P.categories.map((c) => c.id));
P.projects.forEach((p) => {
  assert.ok(cats.has(p.category), p.id + ' has a valid primary category');
  assert.ok(['completed', 'ongoing', 'upcoming'].includes(p.status), p.id + ' has a status');
  assert.ok(p.summary && p.title, p.id + ' has copy');
});
P.categories.forEach((c) => assert.ok(P.projects.some((p) => p.category === c.id), c.id + ' is not empty'));
const by = (id) => P.projects.find((p) => p.id === id);
assert.strictEqual(by('missing-component').category, 'app');
assert.strictEqual(by('missing-trace').category, 'app');
assert.strictEqual(by('missing-component').role, 'Team');
assert.strictEqual(by('missing-trace').role, 'Team');
assert.ok(!P.projects.some((p) => /pdf/i.test(p.id + p.title)), 'PDF to Audio removed');
const ao = by('autoops');
assert.strictEqual(ao.status, 'upcoming');
assert.ok(!ao.links || ao.links.length === 0, 'AutoOps AI has no links');
assert.ok(!JSON.stringify(ao).includes('github'), 'AutoOps AI has no GitHub reference');
assert.strictEqual(ao.role, 'Team');
console.log('data ok: ' + ids.length + ' projects, ' + P.categories.length + ' doors');
