Object.defineProperty(exports, '__esModule', {
    value: true
});

const path = require('path');

// explicitly set the config dir, otherwise if oxygen is globally installed it will use cwd
let originalNodeCfgDir = process.env.NODE_CONFIG_DIR;
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../..', 'config');

// import config and @oxygen/logger modules
const config = require('config');
const loggerFactory = require('@oxygenhq/logger');

// setup logger
loggerFactory.init(config.get('logger'));

// revert back NODE_CONFIG_DIR value
process.env.NODE_CONFIG_DIR = originalNodeCfgDir;

exports.default = function logger(name) {
    return loggerFactory.get(name);
};

const LEVEL_INFO = 'info';
const LEVEL_DEBUG = 'debug';
const LEVEL_ERROR = 'error';
const LEVEL_WARN = 'warn';
const ISSUER_SYSTEM = 'system';
const ISSUER_USER = 'user';
exports.DEFAULT_ISSUER = ISSUER_USER;
exports.ISSUERS = {
    SYSTEM: ISSUER_SYSTEM,
    USER: ISSUER_USER
};
exports.LEVELS = {
    INFO: LEVEL_INFO,
    DEBUG: LEVEL_DEBUG,
    ERROR: LEVEL_ERROR,
    WARN: LEVEL_WARN
};
exports.DEFAULT_LOGGER_ISSUER = ISSUER_SYSTEM;

