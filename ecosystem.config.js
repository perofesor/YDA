module.exports = {
  apps: [
    {
      name: 'yda-site',
      script: 'src/server.js',
      cwd: '/home/root/webapp/yda-site',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      time: true,
    },
  ],
};
