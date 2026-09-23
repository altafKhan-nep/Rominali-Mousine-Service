export default {
  apps: [
    {
      name: 'ridetaxi-api',
      cwd: './server',
      script: 'src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
      max_memory_restart: '400M',
      exp_backoff_restart_delay: 100,
      error_file: '/home/deploy/.pm2/logs/ridetaxi-api-error.log',
      out_file: '/home/deploy/.pm2/logs/ridetaxi-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      autorestart: true,
      watch: false,
      max_restarts: 10,
    },
  ],
};
