const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const deploySource = fs.readFileSync(path.join(__dirname, '..', 'deploy-commands.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');

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
  assert.doesNotMatch(commandBlock('panel'), /setName\('list'\)/);
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
  assert.equal(commandBlock('kelp'), '');
});

test('loa startup replaces the legacy reaction embed with the request form', () => {
  assert.match(indexSource, /ensureLoaRequestPanel/);
  assert.match(indexSource, /removeLegacyLoaReactionPanel/);
  assert.doesNotMatch(indexSource, /await ensureLoaReactionPanel\(\)/);
});

test('giveaway create requires mode and uses one conditional count option', () => {
  const block = commandBlock('giveaway');
  assert.match(block, /setName\('mode'\)[\s\S]*setRequired\(true\)/);
  assert.match(block, /value: 'standard'/);
  assert.match(block, /value: 'entries'/);
  assert.match(block, /value: 'members'/);
  assert.match(block, /value: 'double_or_keep'/);
  assert.match(block, /setName\('count'\)/);
  assert.doesNotMatch(block, /entries_goal/);
  assert.doesNotMatch(block, /member_goal/);
});

test('panel commands do not leave success confirmation copy behind', () => {
  assert.doesNotMatch(indexSource, /Panel sent\./i);
  assert.doesNotMatch(indexSource, /Automod panel sent\./i);
  assert.doesNotMatch(indexSource, /Anti-raid panel sent\./i);
});

test('admin and points panels expose editable settings and image progress', () => {
  assert.match(indexSource, /buildAutomodSettingsModal/);
  assert.match(indexSource, /buildAntiRaidSettingsModal/);
  assert.match(indexSource, /admin_panel_modal:automod:settings/);
  assert.match(indexSource, /admin_panel_modal:antiraid:settings/);
  assert.match(indexSource, /buildPointProgressImage/);
  assert.match(indexSource, /attachment:\/\/points-progress\.png/);
  assert.doesNotMatch(indexSource, /Manual adjustments:/);
});

test('build editing is tracking-button only and cannot edit status', () => {
  const block = commandBlock('build');
  assert.doesNotMatch(block, /setName\('edit'\)/);
  assert.match(block, /setName\('start'\)/);
  assert.match(block, /setName\('remove'\)/);
  assert.match(indexSource, /build_job_edit_modal/);
  assert.doesNotMatch(indexSource, /setCustomId\('status'\)/);
  assert.doesNotMatch(indexSource, /getTextInputValue\('status'\)/);
  assert.match(indexSource, /setCustomId\('builder_discord'\)/);
  assert.match(indexSource, /setCustomId\('customer_discord'\)/);
});

test('automod words live in settings instead of word action buttons', () => {
  assert.match(indexSource, /setCustomId\('blocked_words'\)/);
  assert.match(indexSource, /censorBlacklistedWord/);
  assert.doesNotMatch(indexSource, /admin_panel:automod:add_word/);
  assert.doesNotMatch(indexSource, /admin_panel:automod:remove_word/);
  assert.doesNotMatch(indexSource, /admin_panel:automod:list_words/);
});

test('manage level adjustment only appears on the level view', () => {
  assert.match(indexSource, /function manageLevelRows/);
  const manageRowsStart = indexSource.indexOf('function manageRows');
  const manageRowsEnd = indexSource.indexOf('function manageBackRow', manageRowsStart);
  const manageRowsBlock = indexSource.slice(manageRowsStart, manageRowsEnd);
  assert.doesNotMatch(manageRowsBlock, /manage_level_adjust/);
  const levelRowsStart = indexSource.indexOf('function manageLevelRows');
  const levelRowsEnd = indexSource.indexOf('function formatLogRows', levelRowsStart);
  const levelRowsBlock = indexSource.slice(levelRowsStart, levelRowsEnd);
  assert.match(levelRowsBlock, /manage_level_adjust/);
});
