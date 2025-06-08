/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
const { MongoClient } = require('mongodb');
import OxygenModule from '../core/OxygenModule';
import OxError from '../errors/OxygenError';
import errHelper from '../errors/helper';

const MODULE_NAME = 'mongo';

/**
 * @name shell
 * @description Provides methods for working with operating system shell.
 */
export default class MongoDbModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._alwaysInitialized = false;
        this._isInitialized = false;
        this.client;
        this.db;
        this.collection;
    }
    /**
     * @summary Initializes MongoDB session.
     * @function init
     * @param {string} host - Host name of the target MongoDB server.
     * @param {string} dbName - Database name.
     */
    async init(
        host,
        dbName,
        username,
        password,
        authSource = 'admin',
        port = 27017,
    ) {
        const encUsername = encodeURIComponent(username);
        const encPassword = encodeURIComponent(password);
        const uri = `mongodb://${encUsername}:${encPassword}@${host}:${port}/${dbName}?authSource=${authSource}`;
        this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            await this.client.connect();
            this._isInitialized = true;
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.MONGODB_ERROR, e.message, null, true, e);
        }
    }

    setDatabase(dbName) {
        this.db = this.client.db(dbName);
    }

    setCollection(collectionName) {
        if (!this.db) {
            return false;
        }
        this.collection = this.db.collection(collectionName);
        return true;
    }

    /*
     * @summary Finds documents in the current collection.
     * @function find 
     * @param {object} filter - The filter predicate.
     * @param {object} options - Optional settings for the command.
     * @return {object} A list of documents.
     */
    async find(filter, options) {
        if (!this.collection) {
            return undefined;
        }
        try {
            return await this.collection.find(filter, options).toArray();
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.MONGODB_ERROR, e.message, null, true, e);
        }
    }

    /*
     * @summary Gets the number of documents matching the filter.
     * @function countDocuments 
     * @param {object} filter - The filter for the count.
     * @param {object} options - Optional settings for the command.
     * @return {number} Number of documents matching the filter.
     */
    async countDocuments(filter, options) {
        if (!this.collection) {
            return undefined;
        }
        try {
            return await this.collection.countDocuments(filter, options);
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.MONGODB_ERROR, e.message, null, true, e);
        }
    }

    /*
     * @summary Gets module name
     * @function name
     * @return {String} Constant value "shell".
     */
    get name() {
        return MODULE_NAME;
    }
}