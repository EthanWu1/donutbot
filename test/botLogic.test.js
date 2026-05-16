'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { getTicketViewerRoleIds } = require('../botLogic');

test('spawner tickets exclude support/staff viewer roles', () => {
  const roles = getTicketViewerRoleIds({
    buttonKey: 'spawner_buy',
    isBuilding: false,
    staffRoleIds: ['support-staff', 'legacy-support'],
    builderRoleIds: ['builder'],
    spawnerRoleId: 'spawner-access',
    config: {
      ROLE_OWNER: 'owner',
      ROLE_CO_OWNER: 'co-owner',
      ROLE_STAFF: 'support-staff',
      ROLE_SUPPORT: 'support-role',
      ROLE_ADMIN: 'admin',
      ROLE_MANAGER: 'manager',
      ROLE_CHIEF_MOD: 'chief-mod',
      ROLE_MOD: 'mod',
      ROLE_TRIAL_MOD: 'support-role',
    },
  });

  assert.deepEqual(roles, [
    'owner',
    'co-owner',
    'admin',
    'manager',
    'chief-mod',
    'mod',
    'spawner-access',
  ]);
});

test('non-spawner tickets keep the configured staff viewer roles', () => {
  const roles = getTicketViewerRoleIds({
    buttonKey: 'support',
    isBuilding: false,
    staffRoleIds: ['support-staff', 'legacy-support'],
    builderRoleIds: ['builder'],
    spawnerRoleId: 'spawner-access',
    config: {
      ROLE_ADMIN: 'admin',
    },
  });

  assert.deepEqual(roles, ['support-staff', 'legacy-support']);
});
