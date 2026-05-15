// PM2 ecosystem config — matches the Verba site's supervision pattern.
// Deploy: `pm2 start ecosystem.config.js && pm2 save`
module.exports = {
  apps: [
    {
      name: 'donutbot',
      script: 'index.js',
      cwd: __dirname,
      // Single instance — discord.js doesn't share a gateway connection across workers.
      instances: 1,
      exec_mode: 'fork',
      // Restart with exponential backoff on crash. Cap at 10 restarts in 60s.
      autorestart: true,
      max_restarts: 10,
      min_uptime: '60s',
      restart_delay: 5000,
      // Hard memory ceiling — Puppeteer/litematic renders can spike. If we
      // exceed 1.2 GB something leaked; cycle the process.
      max_memory_restart: '1200M',
      // Logs go to ~/.pm2/logs/donutbot-{out,error}.log by default.
      // Set explicit paths only if you want to ship them off-box.
      env: {
        NODE_ENV: 'production',
        // Puppeteer's default Chromium download is used (bundled in node_modules).
        // If you ever switch to system Chromium, set:
        //   PUPPETEER_SKIP_DOWNLOAD: 'true',
        //   PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium-browser',
      },
    },
  ],
};
