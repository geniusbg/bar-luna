require('dotenv').config();

module.exports = {
  apps: [
    {
      name: process.env.APP_NAME || 'bar-luna',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 4000,
        APP_NAME: process.env.APP_NAME || 'bar-luna'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true
    }
  ]
};

