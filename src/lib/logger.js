import path from 'path';
import fs from 'fs';
import winston from 'winston';

// Use require() for config — import would be hoisted before NODE_CONFIG_DIR is set
const originalNodeCfgDir = process.env.NODE_CONFIG_DIR;
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../..', 'config');
const config = require('config');
process.env.NODE_CONFIG_DIR = originalNodeCfgDir;

export const DEFAULT_ISSUER = 'user';
export const ISSUERS = { SYSTEM: 'system', USER: 'user' };
export const LEVELS = { INFO: 'info', DEBUG: 'debug', ERROR: 'error', WARN: 'warn' };
export const DEFAULT_LOGGER_ISSUER = 'system';

const timestampFormat = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' });

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ level, message }) => `${level}: ${message}`)
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
    const wrap = {};
    for (const level of ['info', 'debug', 'warn', 'error']) {
        wrap[level] = (msg, ...rest) => {
            const formatted = `[${prefix}] ${rest.length ? msg + ' ' + rest.map(a => a instanceof Error ? a.stack || a.message : String(a)).join(' ') : msg}`;
            _logger[level](formatted);
        };
    }
    return wrap;
}

// initialise immediately from config
init(config.has('logger') ? config.get('logger') : {});

export default get;
