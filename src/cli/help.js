/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { getModuleNames } from './args';
import { getModule, getCommand, formatSignature } from './catalog';

export function printUsage() {
    console.log(`Usage: oxygen [OPTIONS]... FILE
       oxygen <verb> [ARGS]...

Run tests:
  oxygen FILE                  Run a test script (.js), a project folder, or an
                               oxygen.conf.js file.

Interactive session:
  oxygen session start [URL]   Start a browser session and print its id.
  oxygen session list          List live sessions. The newest is the default target.
  oxygen session steps         Show every command executed in the session.
  oxygen session save FILE     Write the session's commands out as an Oxygen test.
                               Refs become durable locators, exploration-only commands
                               are dropped, and failed commands are skipped unless
                               --includeFailed is passed.
  oxygen session close [ID]    Close a session (--all closes every one).

  oxygen <module> <command> [ARGS]...
                               Run a single command against the live session. The form
                               mirrors the script API: web.click('id=x') is typed as
                               oxygen web click "id=x".
                               Modules: ${getModuleNames().join(', ')}

  oxygen web snapshot          List every actionable element on the page with its role,
                               name, a ref to act on now, and a durable locator to put
                               in a test. Narrow a large page with
                               '{"viewportOnly":true}' or '{"maxElements":500}'.
                               Refs are valid until the next snapshot and must never be
                               written into a test file.

Project:
  oxygen init [DIR]            Scaffold a new Oxygen project.
  oxygen help                  Display this information.

Arguments are typed from each command's documented signature, so numbers, booleans and
objects can be written plainly - and a numeric-looking string stays a string:
  oxygen web click "id=x" 5000
  oxygen web snapshot '{"viewportOnly":true}'
  oxygen web type "id=zip" "90210"        <- stays the string "90210"
Prefix an argument with "json:" to force it to be read as a JSON literal.

  oxygen <module>              List a module's commands.
  oxygen <module> <command> --help
                               Show a command's arguments and what it returns.

General options:
  -d, --delay=SECONDS        Delay between each command in seconds.
      --rf={html|pdf|xml|excel|junit|json}  Reports file format. Default is html.
      --ro=PATH              Output path for report file. If specified, the report
                             will overwrite any previous reports.
  -i, --iter=COUNT           Number of times to run the test. Default is 1.
  -p, --param=FILE           Parameters file. If not specified an attempt will
                             be made to load parameters from a file named same
                             as the test script, located in the same directory,
                             and having extension - xlsx, xls, csv, or txt.
      --pm={seq|random|all}  Order in which to read the parameters - sequential,
                             random, all. Default is seq.
                             In 'seq' and 'random' modes test will run exact number
                             of times specified with the -i option.
                             In 'all' mode, all available parameters will be read
                             sequentially. This option is mutually exclusive with
                             -i option.
      --dbgport=PORT         Debugger port.
      --wsport=PORT          WebSocket events reporter port.
      --suites               Filter out suites by name
      --env=NAME             Environment to use. Default is 'default'.
  -h, --help                 Display this information and exit.
  -v, --version              Display version information and exit.

Session options:
      --session=ID           Target a specific session. Defaults to the newest one.
      --json                 Machine-readable output. Does not affect how command
                             arguments are parsed - use the "json:" prefix for that.
      --idleTimeout=SECONDS  Shut the session down after this much inactivity.
                             Default is 1800 (30 minutes).
      --timeout=SECONDS      How long commands wait for elements. Default is 10 in a
                             session, against 60 in a test run - a mistyped locator
                             should not hang a prompt for a minute. Change it mid-session
                             with: oxygen web setTimeout json:60000

Web test options:
  -b, --browser={chrome|ie|safari|firefox}  Browser name. Default is chrome.
  -s, --server=SERVER_URL    Selenium hub URL. Default is http://localhost:4444/wd/hub.
      --reopen={true|false}  Reopen browser on each iteration. Default is false.

Mobile test options:
    -s, --server=SERVER_URL  Appium server URL. Default is http://localhost:4723.`);
}

/*
 * `oxygen web` with no command: what this module can do.
 */
export function printModuleHelp(moduleName) {
    const mod = getModule(moduleName);
    if (!mod) {
        console.error(`No catalogue entry for module "${moduleName}". Run "npm run catalog" to generate it.`);
        console.error(`Usage: oxygen ${moduleName} <command> [args...]`);
        return 1;
    }
    if (mod.description) {
        console.log(`${moduleName} - ${mod.description}`);
        console.log('');
    }
    const names = Object.keys(mod.commands).sort();
    const width = Math.max(...names.map((n) => n.length));
    for (const name of names) {
        const command = mod.commands[name];
        const marker = command.agentVisible === false ? ' ' : ' ';
        console.log(`  ${marker}${name.padEnd(width)}  ${command.summary || ''}`);
    }
    console.log(`\n${names.length} commands. For one command's arguments: oxygen ${moduleName} <command> --help`);
    return 0;
}

/*
 * `oxygen web click --help`: the signature, straight from the JSDoc the implementation
 * carries, so it cannot describe a command the code no longer has.
 */
export function printCommandHelp(moduleName, commandName) {
    const command = getCommand(moduleName, commandName);
    if (!command) {
        const mod = getModule(moduleName);
        console.error(`Unknown command: "${moduleName}.${commandName}".`);
        if (mod) {
            console.error(`Run "oxygen ${moduleName}" to list the ${Object.keys(mod.commands).length} commands it has.`);
        }
        return 1;
    }

    console.log(formatSignature(moduleName, command));
    if (command.summary) {
        console.log(`\n  ${command.summary}`);
    }
    if (command.description) {
        console.log(`  ${command.description}`);
    }
    if (command.deprecated) {
        console.log(`\n  DEPRECATED: ${command.deprecated === true ? 'do not use in new tests' : command.deprecated}`);
    }

    if (command.params.length) {
        console.log('\nArguments:');
        for (const param of command.params) {
            const type = (param.schema && param.schema.type) || 'any';
            const required = param.required ? '' : ' (optional)';
            console.log(`  ${param.name} <${type}>${required}`);
            if (param.description) {
                console.log(`      ${param.description}`);
            }
            const properties = param.schema && param.schema.properties;
            if (properties) {
                for (const key of Object.keys(properties)) {
                    console.log(`      .${key} <${properties[key].type || 'any'}> ${properties[key].description || ''}`);
                }
            }
        }
    }

    if (command.returns && command.returns.schema && command.returns.schema.type) {
        console.log(`\nReturns: ${command.returns.schema.type}${command.returns.description ? ' - ' + command.returns.description : ''}`);
    }

    console.log(`\nRun it against the live session:\n  oxygen ${moduleName} ${commandName}${command.params.map((p) => ' <' + p.name + '>').join('')}`);
    return 0;
}
