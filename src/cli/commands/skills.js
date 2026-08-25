/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * `oxygen skills install` - put the bundled agent skills where Claude Code looks for them.
 *
 * The skills document this CLI's own flags and commands, so their version has to match the
 * CLI's. Shipping them inside the package and installing from there is what keeps the two
 * together: a set copied by hand once goes quietly stale against a newer CLI, and the
 * failure mode is an agent confidently using a flag that no longer exists.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

// Claude Code reads skills from a per-user directory and from a per-project one. The
// project directory is the better default: it can be committed, so a clone brings the
// skills with it and nobody has to remember an install step.
const USER_SKILLS_DIR = path.join(os.homedir(), '.claude', 'skills');
const PROJECT_SKILLS_DIR = path.join('.claude', 'skills');

export default async function skills(argv) {
    const sub = argv._[1];
    if (!sub || sub === 'help') {
        return printUsage();
    }
    if (sub !== 'install' && sub !== 'list' && sub !== 'path') {
        console.error(`Unknown skills command: "${sub}". Expected: install, list, path.`);
        return 1;
    }

    const source = bundledSkillsDir();
    if (!source) {
        console.error(
            'Cannot find the bundled skills. They ship inside the oxygen-cli package;\n' +
            'a source checkout needs "npm run build" first.'
        );
        return 1;
    }
    const available = listSkills(source);
    if (!available.length) {
        console.error(`No skills found in ${source}`);
        return 1;
    }

    if (sub === 'path') {
        console.log(source);
        return 0;
    }
    if (sub === 'list') {
        console.log(`${available.length} skills bundled with oxygen-cli:\n`);
        for (const name of available) {
            console.log(`   ${name.padEnd(26)} ${summaryOf(path.join(source, name, 'SKILL.md'))}`);
        }
        console.log('\nInstall them with: oxygen skills install [--user]');
        return 0;
    }

    const target = argv.user
        ? USER_SKILLS_DIR
        : path.resolve(argv.cwd || process.cwd(), PROJECT_SKILLS_DIR);

    const clashes = available.filter((name) => fs.existsSync(path.join(target, name)));
    if (clashes.length && !argv.force) {
        console.error(`These skills are already installed in ${target}:`);
        for (const name of clashes) {
            console.error(`  ${name}`);
        }
        console.error('\nPass --force to replace them with this version.');
        return 1;
    }

    fs.mkdirSync(target, { recursive: true });
    for (const name of available) {
        const to = path.join(target, name);
        fs.rmSync(to, { recursive: true, force: true });
        fs.cpSync(path.join(source, name), to, { recursive: true });
    }

    console.log(`Installed ${available.length} skills into ${target}`);
    for (const name of available) {
        console.log(`  ${name}`);
    }
    console.log(
        argv.user
            ? '\nThey are available in every project on this machine.'
            : '\nCommit .claude/skills so anyone who clones this project gets them too.'
    );
    console.log('Claude Code picks them up on its next start; "/skills" lists what it can see.');
    return 0;
}

/*
 * Where the skills sit at run time. Built output lives in build/, one level below the
 * package root, and the source tree is laid out the same way relative to src/ - so the
 * same two candidates cover an installed package and a working checkout.
 */
export function bundledSkillsDir() {
    const candidates = [
        path.resolve(__dirname, '..', '..', 'skills'),
        path.resolve(__dirname, '..', '..', '..', 'skills'),
    ];
    return candidates.find((dir) => fs.existsSync(dir)) || null;
}

function listSkills(dir) {
    try {
        return fs.readdirSync(dir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, 'SKILL.md')))
            .map((entry) => entry.name)
            .sort();
    }
    catch (e) {
        return [];
    }
}

/*
 * First sentence of the skill's description, for the listing. The frontmatter is read with
 * a line scan rather than a YAML parser - it is two known fields, and adding a dependency
 * to read them would not earn its place.
 */
function summaryOf(skillFile) {
    let text;
    try {
        text = fs.readFileSync(skillFile, 'utf8');
    }
    catch (e) {
        return '';
    }
    const match = /^description:\s*(.+)$/m.exec(text);
    if (!match) {
        return '';
    }
    const sentence = match[1].split(/(?<=[.!?])\s/)[0].trim();
    return sentence.length > 88 ? sentence.slice(0, 87) + '…' : sentence;
}

function printUsage() {
    console.log(`Usage: oxygen skills <command>

  install        Copy the bundled skills into .claude/skills in this project.
                 --user   install into ~/.claude/skills instead, for every project
                 --force  replace skills that are already installed
  list           Show which skills ship with this version of Oxygen.
  path           Print the directory the bundled skills are read from.

The skills teach an agent how to structure an Oxygen project, write tests, drive a
session, and read a failure report. They document this CLI's flags, so install them
from the same version of Oxygen you are running.`);
    return 0;
}
