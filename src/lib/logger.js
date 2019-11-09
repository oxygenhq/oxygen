Object.defineProperty(exports, "__esModule", {
    value: true
});
  
const path = require('path');

// explicitly set the config dir, otherwise if oxygen is globally installed it will use cwd
let originalNodeCfgDir = process.env.NODE_CONFIG_DIR;
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../..', 'config');

// import config and oxygen-logger modules
const config = require('config');
const loggerFactory = require('oxygen-logger');

// setup logger
loggerFactory.init(config.get('logger'));

// revert back NODE_CONFIG_DIR value
process.env.NODE_CONFIG_DIR = originalNodeCfgDir;

exports.default = function logger(name) {
    return loggerFactory.get(name);
};

const DEFAULT_ISSUER = 'user';
exports.DEFAULT_ISSUER = DEFAULT_ISSUER;

