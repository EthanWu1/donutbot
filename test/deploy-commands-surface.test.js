const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const deploySource = fs.readFileSync(path.join(__dirname, '..', 'deploy-commands.js'), 'utf8');

function commandBlock(name) {
  const start = deploySource.search(new RegExp(`new SlashCommandBuilder\\(\\)\\s*\\.setName\\('${name}'\\)`));
  if (start < 0) return '';
  const rest = deploySource.slice(start + 1);
  const next = rest.search(/new SlashCommandBuilder\(\)/);
  return deploySource.slice(start, next < 0 ? undefined : start + 1 + next);
}

test('slash command surface keeps admin utilities off panel send', () => {
  assert.match(deploySource, /\.setName\('points'\)/);
  assert.doesNotMatch(deploySource, /\.setName\('rank'\)/);
  assert.doesNotMatch(deploySource, /\.setName\('help'\)/);
  assert.doesNotMatch(deploySource, /\.setName\('apply'\)/);
  assert.doesNotMatch(deploySource, /\.setName\('afk'\)/);
  assert.equal(commandBlock('role'), '');
  assert.doesNotMatch(deploySource, /\.setName\('stats'\)/);
  assert.match(deploySource, /\.setName\('panel'\)/);
  assert.match(deploySource, /\.setName\('activity'\)/);
  assert.match(deploySource, /\.setName\('automod'\)/);
  assert.match(deploySource, /\.setName\('antiraid'\)/);
  assert.match(deploySource, /\.setName\('vouches'\)/);
  assert.match(deploySource, /\.setName\('manage'\)/);
  assert.doesNotMatch(deploySource, /\.setName\('vouch'\)/);
  assert.doesNotMatch(deploySource, /value: 'automod'/);
  assert.doesNotMatch(deploySource, /value: 'antiraid'/);
  assert.doesNotMatch(deploySource, /value: 'vouches'/);
  assert.doesNotMatch(deploySource, /value: 'people'/);
  assert.match(deploySource, /setName\('vouches'\)[\s\S]*setName\('member'\)/);
  assert.match(deploySource, /setName\('manage'\)[\s\S]*setName\('member'\)/);
  assert.match(commandBlock('level'), /setName\('user'\)/);
  assert.doesNotMatch(commandBlock('level'), /addSubcommand/);
  assert.doesNotMatch(commandBlock('automod'), /addSubcommand/);
  assert.doesNotMatch(commandBlock('antiraid'), /addSubcommand/);
});
