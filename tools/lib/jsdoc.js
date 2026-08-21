/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Shared JSDoc extraction for Oxygen's module sources.
 *
 * Two generators read these comments - the published API docs and the machine-readable
 * command catalogue. They must agree about what a command's signature is, so they read
 * through this one parser rather than each carrying its own.
 */

const fs = require('fs');
const doctrine = require('doctrine');

const COMMENT_REGEX = /(\/\*\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)/g;

/*
 * Every JSDoc block in a file, in source order, as doctrine parse trees.
 */
function parseComments(source) {
    const regex = new RegExp(COMMENT_REGEX);
    const comments = [];
    let raw;
    while ((raw = regex.exec(source)) !== null) {
        comments.push(doctrine.parse(raw[0], { unwrap: true }));
    }
    return comments;
}

function parseFile(file) {
    return parseComments(fs.readFileSync(file, 'utf8'));
}

function findTag(parsed, title) {
    if (!parsed || !Array.isArray(parsed.tags)) {
        return null;
    }
    for (const tag of parsed.tags) {
        if (tag.title === title) {
            return tag;
        }
    }
    return null;
}

function findTags(parsed, title) {
    if (!parsed || !Array.isArray(parsed.tags)) {
        return [];
    }
    return parsed.tags.filter((tag) => tag.title === title);
}

module.exports = {
    COMMENT_REGEX,
    parseComments,
    parseFile,
    findTag,
    findTags,
};
