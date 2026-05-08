process.env.NODE_ENV = 'production';
const path = require('path');
const dir = path.join(__dirname, '.next', 'standalone');
process.chdir(dir);
require(path.join(dir, 'server.js'));