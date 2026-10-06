/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Records what a person does by hand in a live session's browser.
 *
 * `oxygen session record start` makes the session host poll the page with recorderTick():
 * each tick installs the listeners if the current document does not have them yet (every
 * navigation starts a fresh document) and drains the actions captured since the last one.
 * Actions are buffered in sessionStorage as they happen, because the click that navigates
 * away unloads the page before the next tick could read an in-memory buffer.
 *
 * toJournalEntries() turns those actions into the same journal entries a command sent
 * from the CLI produces, so `oxygen session save` writes them out with no special case.
 */

/*
 * Runs inside the browser.
 *
 * WebdriverIO serializes this function and injects it into the page, so the same rules
 * as snapshot.js apply: browser globals only, and no syntax Babel would compile into a
 * helper call (spread, destructuring, for...of).
 */
/* eslint-disable no-undef */
export function recorderTick(options) {
    var KEY = '__oxygenRecorder';
    var stop = options && options.stop;

    function readBuffer() {
        try {
            var stored = window.sessionStorage.getItem(KEY);
            return stored ? JSON.parse(stored) : [];
        }
        catch (e) {
            return window[KEY + 'Buffer'] || [];
        }
    }

    function writeBuffer(events) {
        try {
            window.sessionStorage.setItem(KEY, JSON.stringify(events));
        }
        catch (e) {
            // sessionStorage is unavailable on some pages (sandboxed frames, data: URLs);
            // an in-memory buffer still works for everything that does not navigate
            window[KEY + 'Buffer'] = events;
        }
    }

    function drain() {
        var events = readBuffer();
        writeBuffer([]);
        return events;
    }

    if (stop) {
        var state = window[KEY];
        if (state) {
            document.removeEventListener('click', state.onClick, true);
            document.removeEventListener('change', state.onChange, true);
            document.removeEventListener('keydown', state.onKeyDown, true);
            delete window[KEY];
        }
        return { url: location.href, title: document.title, installed: false, events: drain() };
    }

    if (window[KEY]) {
        return { url: location.href, title: document.title, installed: false, events: drain() };
    }

    // Same rules as snapshot.js, so a recorded step and a snapshot suggest the same
    // locator for the same element.
    var GENERATED_ID = /^(mat-|ember\d|react-|radix-|headlessui-|:r[0-9a-z]+:|ext-gen|yui_)/i;
    var TEST_ATTRS = ['data-testid', 'data-test-id', 'data-test', 'data-cy', 'data-qa', 'data-automation-id'];
    var CLICKABLE = 'a,button,input,select,textarea,label,summary,option,' +
        '[role=button],[role=link],[role=checkbox],[role=radio],[role=tab],[role=menuitem],' +
        '[role=option],[role=switch],[onclick]';
    var TEXT_TYPES = { text: 1, email: 1, password: 1, search: 1, tel: 1, url: 1, number: 1,
        date: 1, 'datetime-local': 1, month: 1, time: 1, week: 1 };

    function attr(el, name) {
        var value = el.getAttribute && el.getAttribute(name);
        return value === null || value === undefined ? '' : String(value).trim();
    }

    function text(el) {
        var value = (el.textContent || '').replace(/\s+/g, ' ').trim();
        return value.length > 80 ? value.slice(0, 80) : value;
    }

    function cssQuote(value) {
        return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function xpathQuote(value) {
        if (value.indexOf('"') < 0) {
            return '"' + value + '"';
        }
        if (value.indexOf("'") < 0) {
            return "'" + value + "'";
        }
        return 'concat("' + value.replace(/"/g, '", \'"\', "') + '")';
    }

    function isTextEntry(el) {
        var tag = el.tagName.toLowerCase();
        if (tag === 'textarea') {
            return true;
        }
        if (tag === 'input') {
            return !!TEXT_TYPES[(attr(el, 'type') || 'text').toLowerCase()];
        }
        return el.isContentEditable === true;
    }

    function absoluteXpath(el) {
        var parts = [];
        while (el && el.nodeType === 1 && el !== document.documentElement) {
            var index = 1;
            var sibling = el.previousElementSibling;
            while (sibling) {
                if (sibling.tagName === el.tagName) {
                    index++;
                }
                sibling = sibling.previousElementSibling;
            }
            parts.unshift(el.tagName.toLowerCase() + '[' + index + ']');
            el = el.parentElement;
        }
        return '/html/' + parts.join('/');
    }

    /*
     * The most durable locator available, and whether it is one worth committing. An
     * element with nothing stable on it still gets a locator - the recording must replay -
     * but it is flagged so the saved script carries a TODO instead of a silent XPath.
     */
    function locatorOf(el) {
        var id = attr(el, 'id');
        if (id && !GENERATED_ID.test(id) && !/\d{4,}/.test(id)) {
            return { locator: 'id=' + id, stable: true };
        }
        for (var i = 0; i < TEST_ATTRS.length; i++) {
            var value = attr(el, TEST_ATTRS[i]);
            if (value) {
                return { locator: 'css=[' + TEST_ATTRS[i] + '="' + cssQuote(value) + '"]', stable: true };
            }
        }
        var name = attr(el, 'name');
        if (name) {
            return { locator: 'name=' + name, stable: true };
        }
        var tag = el.tagName.toLowerCase();
        var label = attr(el, 'aria-label');
        if (label) {
            return { locator: '//' + tag + '[@aria-label=' + xpathQuote(label) + ']', stable: true };
        }
        var own = text(el);
        if (tag === 'a' && own) {
            return { locator: 'link=' + own, stable: true };
        }
        if ((tag === 'button' || attr(el, 'role') === 'button') && own) {
            return { locator: '//' + tag + '[normalize-space()=' + xpathQuote(own) + ']', stable: true };
        }
        var placeholder = attr(el, 'placeholder');
        if (placeholder) {
            return { locator: '//' + tag + '[@placeholder=' + xpathQuote(placeholder) + ']', stable: true };
        }
        return { locator: absoluteXpath(el), stable: false };
    }

    function describe(el) {
        var tag = el.tagName.toLowerCase();
        var name = attr(el, 'aria-label') || attr(el, 'placeholder') || text(el) || attr(el, 'name') || attr(el, 'id');
        return tag + (name ? ' "' + name + '"' : '');
    }

    // Shadow DOM retargets event.target to the host; the real element is first in the path.
    function originOf(event) {
        var path = event.composedPath ? event.composedPath() : null;
        return (path && path.length && path[0].nodeType === 1) ? path[0] : event.target;
    }

    function push(action, el) {
        var found = locatorOf(el);
        action.locator = found.locator;
        action.stable = found.stable;
        action.element = describe(el);
        action.url = location.href;
        action.at = Date.now();
        var events = readBuffer();
        events.push(action);
        writeBuffer(events);
    }

    function recordValue(el) {
        var value = el.isContentEditable ? el.textContent : el.value;
        // Enter and the change event that follows it report the same value - record once
        if (el.__oxygenRecorded === value) {
            return;
        }
        el.__oxygenRecorded = value;
        push({
            kind: 'type',
            value: value,
            sensitive: (attr(el, 'type') || '').toLowerCase() === 'password'
        }, el);
    }

    function onClick(event) {
        var origin = originOf(event);
        if (!origin || !origin.closest) {
            return;
        }
        var el = origin.closest(CLICKABLE) || origin;
        var tag = el.tagName.toLowerCase();
        // focusing a field or opening a native dropdown is implied by the type/select
        // step that follows, so recording the click would only add noise
        if (isTextEntry(el) || tag === 'select' || tag === 'option') {
            return;
        }
        // a click on a label is re-dispatched to its control, which is recorded instead
        if (tag === 'label' && el.control) {
            return;
        }
        // Enter in a form field submits by clicking the form's submit button for you; that
        // click carries no pointer detail and follows the Enter at once. The Enter is
        // already recorded, and replaying both would submit twice.
        var enter = window[KEY] && window[KEY].lastEnter;
        if (enter && event.detail === 0 && el.form && el.form === enter.form && Date.now() - enter.at < 500) {
            return;
        }
        push({ kind: 'click' }, el);
    }

    function onChange(event) {
        var el = originOf(event);
        if (!el || !el.tagName) {
            return;
        }
        var tag = el.tagName.toLowerCase();
        if (tag === 'select') {
            var option = el.options[el.selectedIndex];
            if (option) {
                push({ kind: 'select', option: 'label=' + text(option) }, el);
            }
            return;
        }
        if (tag === 'input' && (attr(el, 'type') || '').toLowerCase() === 'file') {
            push({ kind: 'file' }, el);
            return;
        }
        if (isTextEntry(el)) {
            recordValue(el);
        }
    }

    function onKeyDown(event) {
        if (event.key !== 'Enter' || event.isComposing) {
            return;
        }
        var el = originOf(event);
        if (!el || !el.tagName || !isTextEntry(el) || el.tagName.toLowerCase() === 'textarea') {
            return;
        }
        // Enter usually submits and navigates before any change event fires, so the value
        // typed so far is captured here, followed by the key itself
        recordValue(el);
        push({ kind: 'enter' }, el);
        window[KEY].lastEnter = { form: el.form, at: Date.now() };
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('change', onChange, true);
    document.addEventListener('keydown', onKeyDown, true);
    window[KEY] = { onClick: onClick, onChange: onChange, onKeyDown: onKeyDown };

    return { url: location.href, title: document.title, installed: true, events: drain() };
}
/* eslint-enable no-undef */

/*
 * Translate recorded actions into journal entries. Every entry is marked as coming from
 * the user, and anything that will not replay as written carries a `todo` the generated
 * script turns into a comment.
 */
export function toJournalEntries(actions) {
    const entries = [];
    for (const action of actions) {
        const entry = { module: 'web', status: 'passed', at: action.at || Date.now(), source: 'user' };
        const todos = [];
        // a key press is sent to whatever has focus, so its locator never reaches the script
        if (!action.stable && action.kind !== 'enter') {
            todos.push(`no stable locator for ${action.element} - replace this XPath`);
        }
        switch (action.kind) {
            case 'click':
                entry.command = 'click';
                entry.args = [action.locator];
                break;
            case 'type':
                entry.command = 'type';
                if (action.sensitive) {
                    // never let a password the user typed reach the journal or a saved file
                    entry.args = [action.locator, 'TODO'];
                    todos.push(`password typed into ${action.element} - use a secret: reference, not the value`);
                }
                else {
                    entry.args = [action.locator, action.value];
                }
                break;
            case 'enter':
                entry.command = 'sendKeys';
                entry.args = [['Enter']];
                break;
            case 'select':
                entry.command = 'select';
                entry.args = [action.locator, action.option];
                break;
            case 'file':
                entry.command = 'fileBrowse';
                entry.args = [action.locator, 'TODO'];
                todos.push(`file chosen in ${action.element} - the path is not visible to the page, fill it in`);
                break;
            default:
                continue;
        }
        if (todos.length) {
            entry.todo = todos;
        }
        entries.push(entry);
    }
    return entries;
}

// for printing a recording back to whoever is watching the terminal
export function describeEntry(entry) {
    const args = (entry.args || []).map((a) => JSON.stringify(a)).join(', ');
    return `${entry.module}.${entry.command}(${args})${entry.todo ? '   <- ' + entry.todo.join('; ') : ''}`;
}
