import path from 'path';
import config from 'config';
import loggerFactory from 'oxygen-logger';

// explicitly set the config dir, otherwise if oxygen is globally installed it will use cwd
var originalNodeCfgDir = process.env.NODE_CONFIG_DIR;
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '..', 'config');
process.env.NODE_CONFIG_DIR = originalNodeCfgDir;

// setup logger
loggerFactory.init(config.get('logger'));

export default function logger(name) {
    return loggerFactory.get(name);
}

export const DEFAULT_ISSUER = 'user';