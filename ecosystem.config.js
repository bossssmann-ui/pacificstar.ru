'use strict';

/**
 * Timeweb App Platform runs PM2 by default. Use either:
 *   npm start
 * or:
 *   pm2 start ecosystem.config.js --no-daemon --update-env
 * so panel ENV vars reach node (pm2 restart alone may keep stale env).
 */
module.exports = {
  apps: [{
    name: 'pacificstar',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
  }],
};
