const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const deploySource = fs.readFileSync(path.join(__dirname, '..', 'deploy-commands.js'), 'utf8');

function commandBlock(name) {
  const match = deploySource.match(new RegExp(`new SlashCommandBuilder\\(\\)\\s*\\.setName\\('${name}'\\)[\\s\\S]*?\\n\\s*\\.setDefaultMemberPermissions\\(PermissionFlagsBits\\.ManageGuild\\),`));
  return match ? match[0] : '';
}

test('slash command surface keeps admin utilities off panel send', () => {
  assert.match(deploySource, /\.setName\('points'\)/);
  assert.doesNotMatch(deploySource, /\.setName\('rank'\)/);
  assert.match(deploySource, /\.setName\('panel'\)/);
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
  assert.doesNotMatch(commandBlock('automod'), /addSubcommand/);
  assert.doesNotMatch(commandBlock('antiraid'), /addSubcommand/);
});
