/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Generates build/catalog.json - every Oxygen module command as data.
 *
 * The JSDoc on each command is the only place a command's signature is written down, and
 * it is stripped out at compile time. Several things need that signature at run time: the
 * CLI (per-command help, and typing arguments that arrive from a shell as strings), the
 * MCP server (tool schemas), and the agent skills (a command reference). Generating this
 * from the same comments the API docs are built from means it cannot drift from the
 * implementation.
 *
 * Run as part of `npm run build`.
 */

const fs = require('fs');
const path = require('path');
const jsdoc = require('./lib/jsdoc');

const MODULES_DIR = path.resolve(__dirname, '..', 'src', 'ox_modules');
const OUTPUT = path.resolve(__dirname, '..', 'build', 'catalog.json');
const MODULE_FILE_REGEX = /^module-(.+?)\.js$/;

/*
 * Commands kept out of curated agent surfaces. Each exists for a narrow or historical
 * reason and invites confident misuse by a caller working from names alone - clickHidden
 * bypasses the visibility check that catches real bugs, the mock family rewrites network
 * responses, debug halts the run. They stay fully available to hand-written tests and to
 * `oxygen web <command>`; this flag only shapes what a generated tool list offers.
 */
const NOT_AGENT_VISIBLE = [
    'debug', 'clickHidden', 'pointJS', 'rightClickActions', 'makeVisible',
    'mock', 'mockClearAll', 'mockRestoreAll', 'execute', 'setAutoWaitForAngular',
];

/*
 * JSDoc type expression to JSON Schema.
 */
function mapType(type) {
    if (!type) {
        return {};
    }
    switch (type.type) {
        case 'NameExpression':
            return mapTypeName(type.name);
        case 'OptionalType':
        case 'NullableType':
        case 'NonNullableType':
            return mapType(type.expression);
        case 'RestType':
            return { type: 'array', items: mapType(type.expression) };
        case 'TypeApplication': {
            const base = mapType(type.expression);
            if (base.type === 'array' && type.applications && type.applications.length) {
                return { type: 'array', items: mapType(type.applications[0]) };
            }
            return base;
        }
        case 'UnionType': {
            const mapped = (type.elements || []).map(mapType);
            // A union of one distinct kind collapses to it. Otherwise prefer string when
            // it is a member: every such union in this codebase is "a locator string or an
            // already-resolved Element", and only the string form can cross a CLI or a
            // tool call anyway.
            const kinds = [...new Set(mapped.map((m) => m.type).filter(Boolean))];
            if (kinds.length === 1) {
                return { type: kinds[0] };
            }
            if (kinds.includes('string')) {
                return { type: 'string' };
            }
            return {};
        }
        case 'AllLiteral':
        case 'NullLiteral':
        case 'UndefinedLiteral':
        default:
            return {};
    }
}

function mapTypeName(name) {
    switch (String(name).toLowerCase()) {
        case 'string':
            return { type: 'string' };
        case 'number':
        case 'int':
        case 'integer':
            return { type: 'number' };
        case 'boolean':
        case 'bool':
            return { type: 'boolean' };
        case 'array':
            return { type: 'array' };
        case 'object':
            return { type: 'object' };
        case 'function':
            return { type: 'string', format: 'function-source' };
        case 'element':
        case 'elements':
            // an element handle cannot be expressed over a wire protocol; callers pass a locator
            return { type: 'string' };
        default:
            return {};
    }
}

function isOptional(tag) {
    return !!(tag.type && (tag.type.type === 'OptionalType' || tag.type.type === 'NullableType')) ||
           tag.default !== undefined;
}

function clean(text) {
    if (!text) {
        return '';
    }
    return String(text).replace(/\s*\n\s*/g, ' ').trim();
}

/*
 * Turns @param tags into an ordered parameter list. A tag whose name contains a dot
 * (options.maxElements) documents a property of an earlier object parameter rather than a
 * parameter of its own, and is folded into that parameter's schema.
 */
function buildParams(tags) {
    const params = [];
    const byName = {};

    for (const tag of tags) {
        if (!tag.name) {
            continue;
        }
        const dot = tag.name.indexOf('.');
        if (dot > 0) {
            const parentName = tag.name.slice(0, dot);
            const propertyName = tag.name.slice(dot + 1);
            const parent = byName[parentName];
            if (!parent) {
                continue;
            }
            if (parent.schema.type !== 'object') {
                parent.schema = { type: 'object' };
            }
            parent.schema.properties = parent.schema.properties || {};
            const property = mapType(tag.type);
            property.description = clean(tag.description);
            parent.schema.properties[propertyName] = property;
            if (!isOptional(tag)) {
                parent.schema.required = parent.schema.required || [];
                parent.schema.required.push(propertyName);
            }
            continue;
        }
        const param = {
            name: tag.name,
            description: clean(tag.description),
            required: !isOptional(tag),
            schema: mapType(tag.type),
        };
        params.push(param);
        byName[tag.name] = param;
    }

    return params;
}

function buildCommand(parsed) {
    const functionTag = jsdoc.findTag(parsed, 'function');
    if (!functionTag || !functionTag.name) {
        return null;
    }
    const name = functionTag.name;
    const summaryTag = jsdoc.findTag(parsed, 'summary');
    const descriptionTag = jsdoc.findTag(parsed, 'description');
    const returnTag = jsdoc.findTag(parsed, 'return') || jsdoc.findTag(parsed, 'returns');
    const exampleTag = jsdoc.findTag(parsed, 'example');
    const deprecatedTag = jsdoc.findTag(parsed, 'deprecated');

    const command = {
        name,
        summary: clean(summaryTag && summaryTag.description),
        description: clean(descriptionTag && descriptionTag.description),
        params: buildParams(jsdoc.findTags(parsed, 'param')),
        agentVisible: !NOT_AGENT_VISIBLE.includes(name),
    };
    if (returnTag) {
        command.returns = {
            schema: mapType(returnTag.type),
            description: clean(returnTag.description),
        };
    }
    if (exampleTag && exampleTag.description) {
        command.example = String(exampleTag.description).trim();
    }
    if (deprecatedTag) {
        command.deprecated = clean(deprecatedTag.description) || true;
        command.agentVisible = false;
    }
    return command;
}

function buildModule(moduleName, moduleFile, commandsDir) {
    const commands = {};

    // module-level doc block: @name and @description describe the module itself
    const moduleComments = jsdoc.parseFile(moduleFile);
    let description = '';
    for (const parsed of moduleComments) {
        const nameTag = jsdoc.findTag(parsed, 'name');
        if (nameTag) {
            const descriptionTag = jsdoc.findTag(parsed, 'description');
            description = clean(descriptionTag && descriptionTag.description);
            break;
        }
    }

    // commands defined as methods directly on the module class
    for (const parsed of moduleComments) {
        const command = buildCommand(parsed);
        if (command) {
            commands[command.name] = command;
        }
    }

    // commands defined one per file under module-<name>/commands
    if (commandsDir && fs.existsSync(commandsDir)) {
        for (const file of fs.readdirSync(commandsDir).sort()) {
            if (!file.endsWith('.js') || file === 'index.js') {
                continue;
            }
            for (const parsed of jsdoc.parseFile(path.join(commandsDir, file))) {
                const command = buildCommand(parsed);
                if (command) {
                    commands[command.name] = command;
                }
            }
        }
    }

    return { name: moduleName, description, commands };
}

function build() {
    const modules = {};
    let commandCount = 0;

    for (const file of fs.readdirSync(MODULES_DIR).sort()) {
        const match = file.match(MODULE_FILE_REGEX);
        if (!match || !fs.lstatSync(path.join(MODULES_DIR, file)).isFile()) {
            continue;
        }
        const moduleName = match[1];
        const built = buildModule(
            moduleName,
            path.join(MODULES_DIR, file),
            path.join(MODULES_DIR, 'module-' + moduleName, 'commands')
        );
        modules[moduleName] = built;
        commandCount += Object.keys(built.commands).length;
    }

    const catalog = {
        oxygenVersion: require('../package.json').version,
        generatedAt: new Date().toISOString(),
        modules,
    };

    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, JSON.stringify(catalog, null, 2));

    console.log(
        `Wrote ${path.relative(path.resolve(__dirname, '..'), OUTPUT)}: ` +
        `${Object.keys(modules).length} modules, ${commandCount} commands.`
    );
    return catalog;
}

if (require.main === module) {
    build();
}

module.exports = { build, mapType, buildParams };
