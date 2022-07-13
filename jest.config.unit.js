var config = require('./jest.config.base.js');
config.testMatch = ['**/?(*.)+(unit).(spec|test).[jt]s?(x)'];
module.exports = config;
