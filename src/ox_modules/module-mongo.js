/*
 * Copyright (C) 2015-current CloudBeat Limited
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
     * @param {string} hostOrUrl - Host name or full URL of the target MongoDB server.
     * @param {string} dbName - Database name. You can change it later using "setDatabase" method.
     * @param {string} [username] - Optional username for authentication.
     * @param {string} [password] - Optional password for authentication.
     * @param {string} [authSource=admin] - Optional authentication source. Default value is "admin".
     * @param {number} [port=27017] - Optional MongoDB server port. Default value is 27017.
     */
    async init(
        hostOrUrl,
        dbName,
        username,
        password,
        authSource = 'admin',
        port = 27017,
    ) {
        if (!hostOrUrl || typeof hostOrUrl !== 'string') {
            throw new Error('MongoDB host name or full URL is not specified!');
        }
        else if (!dbName) {
            throw new Error('MongoDB database name is not specified!');
        }
        const isFullUrl = /^mongodb(\+srv)?:\/\//i.test(hostOrUrl);
        const uri = isFullUrl
            ? hostOrUrl
            : (() => {
                if (username) {
                    const encUsername = encodeURIComponent(username);
                    const encPassword = password ? encodeURIComponent(password) : undefined;
                    return `mongodb://${encUsername}:${encPassword || ''}@${hostOrUrl}:${port}/${dbName}?authSource=${authSource}`;
                }
                return `mongodb://${hostOrUrl}:${port}/${dbName}?authSource=${authSource}`;
            })();
        this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            await this.client.connect();
            this.db = this.client.db(dbName);
            this._isInitialized = true;
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.MONGODB_ERROR, e.message, null, true, e);
        }
    }

    /**
     * @summary Sets the current database to perform further actions.
     * @function setDatabase 
     * @param {string} dbName - Database name.
     */
    setDatabase(dbName) {
        this.db = this.client.db(dbName);
    }

    /**
     * @summary Sets the current collection to perform further actions.
     * @function setCollection 
     * @param {string} collectionName - Collection name.
     */
    setCollection(collectionName) {
        if (!this.db) {
            return false;
        }
        this.collection = this.db.collection(collectionName);
        return true;
    }

    /**
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

    /**
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

    /**
     * @summary Inserts a single document into a collection.
     * @function insertOne 
     * @param {object} doc - The document to insert.
     * @param {object} options - Optional settings for the command.
     */
    async insertOne(doc, options) {
        if (!this.collection) {
            return undefined;
        }
        try {
            return await this.collection.insertOne(doc, options);
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.MONGODB_ERROR, e.message, null, true, e);
        }
    }

    /**
     * @summary Inserts an array of documents into a collection.
     * @function insertMany 
     * @param {object} docs - The documents to insert.
     * @param {object} options - Optional settings for the command.
     */
    async insertMany(docs, options) {
        if (!this.collection) {
            return undefined;
        }
        try {
            return await this.collection.insertMany(docs, options);
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.MONGODB_ERROR, e.message, null, true, e);
        }
    }

    /**
     * @summary Update a single document in a collection.
     * @function updateOne 
     * @param {object} filter - The filter used to select the document to replace.
     * @param {UpdateFilter<TSchema>|Document[]} update - The modifications to apply.
     * @param {object} options - Optional settings for the command.
     */
    async updateOne(filter, update) {
        if (!this.collection) {
            return undefined;
        }
        try {
            return await this.collection.updateOne(filter, update);
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.MONGODB_ERROR, e.message, null, true, e);
        }
    }

    /**
     * @summary Update multiple documents in a collection.
     * @function updateMany 
     * @param {object} filter - The filter used to select the document to update.
     * @param {UpdateFilter<TSchema>|Document[]} update - The modifications to apply.
     * @param {object} options - Optional settings for the command.
     */
    async updateMany(filter, update, options) {
        if (!this.collection) {
            return undefined;
        }
        try {
            return await this.collection.updateMany(filter, update, options);
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.MONGODB_ERROR, e.message, null, true, e);
        }
    }

    /**
     * @summary Replace a document in a collection with another document.
     * @function replaceOne 
     * @param {object} filter - The filter used to select the document to replace.
     * @param {object} doc - The Document that replaces the matching document.
     * @param {object} options - Optional settings for the command.
     */
    async replaceOne(filter, doc) {
        if (!this.collection) {
            return undefined;
        }
        try {
            return await this.collection.replaceOne(filter, doc);
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.MONGODB_ERROR, e.message, null, true, e);
        }
    }

    /**
     * @summary Delete a document from a collection.
     * @function deleteOne 
     * @param {object} filter - The filter used to select the document to remove.
     * @param {object} options - Optional settings for the command.
     */
    async deleteOne(filter) {
        if (!this.collection) {
            return undefined;
        }
        try {
            return await this.collection.deleteOne(filter);
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.MONGODB_ERROR, e.message, null, true, e);
        }
    }
    /**
     * @summary Delete multiple documents from a collection.
     * @function deleteMany 
     * @param {object} filter - The filter used to select the documents to remove.
     * @param {object} options - Optional settings for the command.
     */
    async deleteMany(filter) {
        if (!this.collection) {
            return undefined;
        }
        try {
            return await this.collection.deleteMany(filter);
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.MONGODB_ERROR, e.message, null, true, e);
        }
    }

    /**
     * @summary Gets module name
     * @function name
     * @return {String} Constant value "shell".
     */
    get name() {
        return MODULE_NAME;
    }
}