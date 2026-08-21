/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Returns a compact, machine-readable description of the elements on the page.
 * @description Unlike `getSource`, which returns raw HTML, this returns only the elements
 *              that can be acted on or that label something - each with its role,
 *              accessible name, current state, and a reference that can be used as a
 *              locator until the next snapshot is taken.
 *
 *              Every entry carries two locators. `ref` (for example `ref=e7`) addresses
 *              the element in the page as it is right now, and is what you use to act on
 *              it immediately. `locator` is a durable locator suggestion - an id, test
 *              attribute or name - and is what belongs in a saved test. A `ref` is only
 *              valid until the next snapshot and must never be written into a test file.
 * @function snapshot
 * @param {Object=} options - Snapshot options.
 * @param {Number=} options.maxElements - Maximum number of elements to return. Default is 200.
 * @param {Boolean=} options.all - Include non-interactive elements such as headings and
 *                                 paragraphs. Default is false.
 * @param {Boolean=} options.viewportOnly - Include only elements currently within the
 *                                          viewport. Default is false.
 * @return {Object} An object with `url`, `title`, `elements`, `total` (how many matched,
 *                   which exceeds `elements.length` when truncated) and `truncated`.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();
 * web.open("https://www.yourwebsite.com");
 * const page = web.snapshot();
 * web.click(page.elements[0].ref);
 */
export async function snapshot(options) {
    const opts = options || {};
    this.helpers.assertArgumentNumberNonNegative(opts.maxElements === undefined ? 0 : opts.maxElements, 'maxElements');

    // Ref numbering continues across snapshots for the life of the session, and is never
    // reused. If each snapshot restarted at e1, a ref held from an earlier snapshot would
    // silently address whatever happened to be first on the new page - the exact class of
    // mistake refs exist to prevent. With a running sequence, a stale ref matches nothing
    // and fails loudly instead.
    if (typeof this._refSequence !== 'number') {
        this._refSequence = 0;
    }

    const result = await this.driver.execute(collectSnapshot, {
        maxElements: opts.maxElements || 200,
        all: !!opts.all,
        viewportOnly: !!opts.viewportOnly,
        startIndex: this._refSequence,
    });
    this._refSequence += result.elements.length;

    // only the newest snapshot's refs resolve; earlier ones are deliberately dropped
    this._snapshotRefs = {};
    const elements = [];
    for (const element of result.elements) {
        this._snapshotRefs[element.ref] = element.xpath;
        const entry = {
            ref: 'ref=' + element.ref,
            role: element.role,
            name: element.name,
            locator: element.locator || null,
        };
        if (element.value !== undefined) {
            entry.value = element.value;
        }
        if (element.state) {
            entry.state = element.state;
        }
        elements.push(entry);
    }

    return {
        url: result.url,
        title: result.title,
        elements,
        total: result.total,
        truncated: result.truncated,
    };
}

/*
 * Runs inside the browser.
 *
 * WebdriverIO serializes this function and injects it into the page, so it may only use
 * browser globals - and must avoid any syntax Babel would compile into a helper call,
 * since those helpers do not exist in the page. That rules out spread, destructuring and
 * for...of; plain indexed loops are used throughout.
 */
/* eslint-disable no-undef */
function collectSnapshot(options) {
    var maxElements = options.maxElements;
    var includeAll = options.all;
    var viewportOnly = options.viewportOnly;
    var counter = options.startIndex;

    var INTERACTIVE_ROLES = {
        link: 1, button: 1, checkbox: 1, radio: 1, textbox: 1, combobox: 1,
        listbox: 1, option: 1, tab: 1, menuitem: 1, slider: 1, 'switch': 1,
        searchbox: 1, spinbutton: 1, file: 1
    };
    var LABEL_ROLES = { heading: 1, label: 1, alert: 1, status: 1, img: 1 };

    // ids produced by a framework change on every build, so a locator built on one is
    // worse than no suggestion at all
    var GENERATED_ID = /^(mat-|ember\d|react-|radix-|headlessui-|:r[0-9a-z]+:|ext-gen|yui_)/i;
    var TEST_ATTRS = ['data-testid', 'data-test-id', 'data-test', 'data-cy', 'data-qa', 'data-automation-id'];

    function isVisible(el) {
        if (!el.getClientRects || el.getClientRects().length === 0) {
            return false;
        }
        var style = window.getComputedStyle(el);
        if (!style || style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') {
            return false;
        }
        return true;
    }

    function inViewport(el) {
        var rect = el.getBoundingClientRect();
        return rect.bottom > 0 && rect.right > 0 &&
               rect.top < (window.innerHeight || 0) && rect.left < (window.innerWidth || 0);
    }

    function text(el) {
        var value = (el.textContent || '').replace(/\s+/g, ' ').trim();
        return value.length > 120 ? value.slice(0, 120) + '…' : value;
    }

    function attr(el, name) {
        var value = el.getAttribute(name);
        return value === null ? '' : value.trim();
    }

    function roleOf(el) {
        var explicit = attr(el, 'role');
        if (explicit) {
            return explicit;
        }
        var tag = el.tagName.toLowerCase();
        if (tag === 'a') {
            return el.hasAttribute('href') ? 'link' : 'generic';
        }
        if (tag === 'button') {
            return 'button';
        }
        if (tag === 'select') {
            return el.multiple ? 'listbox' : 'combobox';
        }
        if (tag === 'textarea') {
            return 'textbox';
        }
        if (tag === 'option') {
            return 'option';
        }
        if (tag === 'img') {
            return 'img';
        }
        if (tag === 'label') {
            return 'label';
        }
        if (tag === 'summary') {
            return 'button';
        }
        if (/^h[1-6]$/.test(tag)) {
            return 'heading';
        }
        if (tag === 'input') {
            var type = (attr(el, 'type') || 'text').toLowerCase();
            if (type === 'checkbox') { return 'checkbox'; }
            if (type === 'radio') { return 'radio'; }
            if (type === 'file') { return 'file'; }
            if (type === 'range') { return 'slider'; }
            if (type === 'number') { return 'spinbutton'; }
            if (type === 'search') { return 'searchbox'; }
            if (type === 'submit' || type === 'button' || type === 'reset' || type === 'image') { return 'button'; }
            if (type === 'hidden') { return 'hidden'; }
            return 'textbox';
        }
        if (el.isContentEditable) {
            return 'textbox';
        }
        if (el.hasAttribute('onclick') || el.hasAttribute('tabindex')) {
            return 'button';
        }
        return 'generic';
    }

    /*
     * A pragmatic subset of the accessible name computation: the sources that actually
     * carry a usable name in practice, in specification order.
     */
    function accessibleName(el, role) {
        var name = attr(el, 'aria-label');
        if (name) {
            return name;
        }
        var labelledBy = attr(el, 'aria-labelledby');
        if (labelledBy) {
            var ids = labelledBy.split(/\s+/);
            var parts = [];
            for (var i = 0; i < ids.length; i++) {
                var referenced = document.getElementById(ids[i]);
                if (referenced) {
                    parts.push(text(referenced));
                }
            }
            if (parts.length) {
                return parts.join(' ');
            }
        }
        if (el.labels && el.labels.length) {
            return text(el.labels[0]);
        }
        var placeholder = attr(el, 'placeholder');
        if (placeholder) {
            return placeholder;
        }
        if (role === 'img') {
            return attr(el, 'alt');
        }
        var title = attr(el, 'title');
        if (title) {
            return title;
        }
        if (role === 'link' || role === 'button' || role === 'heading' ||
            role === 'option' || role === 'label' || role === 'tab' || role === 'menuitem') {
            var own = text(el);
            if (own) {
                return own;
            }
        }
        if (el.tagName.toLowerCase() === 'input') {
            var type = (attr(el, 'type') || '').toLowerCase();
            if (type === 'submit' || type === 'button' || type === 'reset') {
                return attr(el, 'value');
            }
        }
        return '';
    }

    function stateOf(el, role) {
        var state = null;
        function set(key, value) {
            if (state === null) {
                state = {};
            }
            state[key] = value;
        }
        if (el.disabled === true || attr(el, 'aria-disabled') === 'true') {
            set('disabled', true);
        }
        if (role === 'checkbox' || role === 'radio' || role === 'switch') {
            set('checked', el.checked === true || attr(el, 'aria-checked') === 'true');
        }
        if (el.readOnly === true) {
            set('readonly', true);
        }
        if (el.required === true) {
            set('required', true);
        }
        var expanded = attr(el, 'aria-expanded');
        if (expanded) {
            set('expanded', expanded === 'true');
        }
        if (role === 'option') {
            set('selected', el.selected === true || attr(el, 'aria-selected') === 'true');
        }
        return state;
    }

    function cssQuote(value) {
        return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    /*
     * The locator a saved test should use, or an empty string when nothing on the element
     * is stable enough to be worth suggesting.
     */
    function durableLocator(el, role, name) {
        var id = attr(el, 'id');
        if (id && !GENERATED_ID.test(id) && !/\d{4,}/.test(id)) {
            return 'id=' + id;
        }
        for (var i = 0; i < TEST_ATTRS.length; i++) {
            var value = attr(el, TEST_ATTRS[i]);
            if (value) {
                return 'css=[' + TEST_ATTRS[i] + '="' + cssQuote(value) + '"]';
            }
        }
        var elementName = attr(el, 'name');
        if (elementName) {
            return 'name=' + elementName;
        }
        if (role === 'link' && name) {
            return 'link=' + name;
        }
        return '';
    }

    /*
     * An absolute XPath is not a locator anyone should commit, but it is unambiguous for
     * the lifetime of a single snapshot, which is exactly what a ref needs. Oxygen passes
     * anything starting with "/" through to the driver unchanged.
     */
    function xpathOf(el) {
        var segments = [];
        var node = el;
        while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
            var tag = node.tagName.toLowerCase();
            var index = 1;
            var sibling = node.previousElementSibling;
            while (sibling) {
                if (sibling.tagName.toLowerCase() === tag) {
                    index++;
                }
                sibling = sibling.previousElementSibling;
            }
            segments.unshift(tag + '[' + index + ']');
            node = node.parentElement;
        }
        return '/html/' + segments.join('/');
    }

    var all = document.querySelectorAll('*');
    var elements = [];
    var truncated = false;
    var total = 0;

    for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var role = roleOf(el);
        if (role === 'hidden' || role === 'generic') {
            continue;
        }
        var interactive = INTERACTIVE_ROLES[role] === 1;
        if (!interactive && !(includeAll && LABEL_ROLES[role] === 1)) {
            continue;
        }
        if (!isVisible(el)) {
            continue;
        }
        if (viewportOnly && !inViewport(el)) {
            continue;
        }
        var name = accessibleName(el, role);
        // an interactive element with no name at all is usually a wrapper picked up by the
        // tabindex or onclick heuristic, and only adds noise
        if (!name && role === 'button' && !el.hasAttribute('role') &&
            el.tagName.toLowerCase() !== 'button' && el.tagName.toLowerCase() !== 'input') {
            continue;
        }
        total++;
        if (elements.length >= maxElements) {
            truncated = true;
            continue;
        }
        counter++;
        var entry = {
            ref: 'e' + counter,
            role: role,
            name: name,
            locator: durableLocator(el, role, name),
            xpath: xpathOf(el)
        };
        var tag = el.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
            entry.value = el.value === undefined || el.value === null ? '' : String(el.value);
        }
        var state = stateOf(el, role);
        if (state) {
            entry.state = state;
        }
        elements.push(entry);
    }

    return {
        url: window.location.href,
        title: document.title,
        elements: elements,
        total: total,
        truncated: truncated
    };
}
/* eslint-enable no-undef */
