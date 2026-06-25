const path = require('path');
const fs = require('fs');
const winston = require('winston');

// explicitly set the config dir, otherwise if oxygen is globally installed it will use cwd
let originalNodeCfgDir = process.env.NODE_CONFIG_DIR;
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../..', 'config');

const config = require('config');

// revert back NODE_CONFIG_DIR value
process.env.NODE_CONFIG_DIR = originalNodeCfgDir;

const LEVEL_INFO = 'info';
const LEVEL_DEBUG = 'debug';
const LEVEL_ERROR = 'error';
const LEVEL_WARN = 'warn';
const ISSUER_SYSTEM = 'system';
const ISSUER_USER = 'user';

exports.DEFAULT_ISSUER = ISSUER_USER;
exports.ISSUERS = { SYSTEM: ISSUER_SYSTEM, USER: ISSUER_USER };
exports.LEVELS = { INFO: LEVEL_INFO, DEBUG: LEVEL_DEBUG, ERROR: LEVEL_ERROR, WARN: LEVEL_WARN };
exports.DEFAULT_LOGGER_ISSUER = ISSUER_SYSTEM;

const timestampFormat = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' });

const consoleFormat = winston.format.combine(
    timestampFormat,
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
);

const fileFormat = winston.format.combine(
    timestampFormat,
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
);

function buildTransports(args = {}) {
    const transports = [];
    const consoleLevel = (args.console && args.console.level) || 'info';

    transports.push(new winston.transports.Console({ level: consoleLevel, format: consoleFormat }));

    if (args.file && args.file.path) {
        let filePath = args.file.path;
        // resolve environment variables in path
        if (process.platform === 'win32') {
            filePath = filePath.replace(/%([^%]+)%/g, (_, k) => process.env[k] || '');
        } else {
            filePath = filePath.replace(/\$([^$/]+)\//g, (_, k) => process.env[k] || '');
        }
        if (!path.isAbsolute(filePath)) {
            filePath = path.resolve(path.dirname(require.main.filename), filePath);
        }
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        transports.push(new winston.transports.File({
            filename: filePath,
            level: args.file.level || 'info',
            format: fileFormat,
        }));
    }

    return transports;
}

let _logger = null;

function init(args = {}) {
    if (_logger) return;
    _logger = winston.createLogger({
        levels: { error: 0, warn: 1, info: 2, debug: 3 },
        transports: buildTransports(args),
    });
    winston.addColors({ error: 'red', warn: 'yellow', info: 'cyan', debug: 'grey' });
}

function get(prefix) {
    if (!_logger) init(config.has('logger') ? config.get('logger') : {});
    if (!prefix) return _logger;
    // return a wrapper that prepends [prefix] to every message
    const wrap = {};
    for (const level of ['info', 'debug', 'warn', 'error']) {
        wrap[level] = (msg, ...rest) => {
            const formatted = `[${prefix}] ${rest.length ? msg + ' ' + rest.map(a => a instanceof Error ? a.stack || a.message : String(a)).join(' ') : msg}`;
            _logger[level](formatted);
        };
    }
    return wrap;
}

// initialise immediately from config so behaviour matches the old library
init(config.has('logger') ? config.get('logger') : {});

exports.default = get;
