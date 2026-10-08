export default {
  apps: [
    {
      name: 'ridetaxi-api',
      cwd: './server',
      script: 'src/index.js',
      // MUST stay 1: Socket.io rooms are per-process and there is no Redis
      // adapter, so 2+ cluster workers silently drop live tracking / driver
      // feed / notification events for sockets on the other worker.
      instances: 1,
      exec_mode: 'fork',
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
      // Relative to cwd (./server) so this works for any SSH user / path.
      error_file: './logs/ridetaxi-api-error.log',
      out_file: './logs/ridetaxi-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      autorestart: true,
      watch: false,
      max_restarts: 10,
    },
  ],
};
