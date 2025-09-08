// server.js
const path = require('path');

process.env.HOSTNAME = '0.0.0.0';
process.env.PORT = process.env.PORT || '5000';
process.env.NODE_ENV = 'production';

const serverPath = path.join(__dirname, '.next/standalone/server.js');
const nextServer = require(serverPath);

console.log(`Server is running on http://${process.env.HOSTNAME}:${process.env.PORT}`);
nextServer();
