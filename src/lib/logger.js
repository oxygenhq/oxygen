import path from 'path';

// explicitly set the config dir, otherwise if oxygen is globally installed it will use cwd
var originalNodeCfgDir = process.env.NODE_CONFIG_DIR;
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../..', 'config');

// import config and oxygen-logger modules
import config from 'config';
import loggerFactory from 'oxygen-logger';

// setup logger
loggerFactory.init(config.get('logger'));

// revert back NODE_CONFIG_DIR value
process.env.NODE_CONFIG_DIR = originalNodeCfgDir;

export default function logger(name) {
    return loggerFactory.get(name);
}

export const DEFAULT_ISSUER = 'user';