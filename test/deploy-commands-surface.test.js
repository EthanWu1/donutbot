const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const deploySource = fs.readFileSync(path.join(__dirname, '..', 'deploy-commands.js'), 'utf8');

test('slash command surface exposes points and panel commands without rank', () => {
  assert.match(deploySource, /\.setName\('points'\)/);
  assert.doesNotMatch(deploySource, /\.setName\('rank'\)/);
  assert.match(deploySource, /\.setName\('panel'\)/);
  assert.match(deploySource, /automod/);
  assert.match(deploySource, /antiraid/);
  assert.match(deploySource, /vouches/);
  assert.match(deploySource, /people/);
});
