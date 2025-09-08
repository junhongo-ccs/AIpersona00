// server.js
const path = require('path');

// 環境変数の設定
process.env.HOSTNAME = '0.0.0.0';
process.env.PORT = process.env.PORT || '5000';
process.env.NODE_ENV = 'production';

// Next.js standaloneサーバーを起動
const nextServer = require('./.next/standalone/server.js');

console.log(`Server is running on http://${process.env.HOSTNAME}:${process.env.PORT}`);
nextServer();