'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { getBrowserLaunchOptions } = require('../lib/litematicRender/renderer');

test('uses packaged chromium on linux hosts without a configured browser path', async () => {
  const opts = await getBrowserLaunchOptions({
    platform: 'linux',
    env: {},
    fileExists: () => false,
    chromiumModule: {
      args: ['--serverless-flag'],
      headless: true,
      executablePath: async () => '/tmp/chromium',
    },
  });

  assert.equal(opts.executablePath, '/tmp/chromium');
  assert.equal(opts.headless, true);
  assert.ok(opts.args.includes('--serverless-flag'));
  assert.ok(opts.args.includes('--no-sandbox'));
  assert.ok(opts.args.includes('--disable-dev-shm-usage'));
});

test('honors an explicit executable path before packaged chromium', async () => {
  let askedForPackagedChromium = false;
  const opts = await getBrowserLaunchOptions({
    platform: 'linux',
    env: { PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium' },
    fileExists: (p) => p === '/usr/bin/chromium',
    chromiumModule: {
      args: ['--serverless-flag'],
      executablePath: async () => {
        askedForPackagedChromium = true;
        return '/tmp/chromium';
      },
    },
  });

  assert.equal(opts.executablePath, '/usr/bin/chromium');
  assert.equal(askedForPackagedChromium, false);
});
