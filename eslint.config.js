const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    js.configs.recommended,
    {
        linterOptions: {
            reportUnusedDisableDirectives: 'off',
        },
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-console': 'off',
            'indent': 'off',
            'indent-legacy': ['error', 4, { 'ArrayExpression': 'first', 'SwitchCase': 1 }],
            'quotes': ['error', 'single', { 'avoidEscape': true }],
            'semi': ['error', 'always'],
            'semi-spacing': ['error', { 'before': false, 'after': true }],
            'no-unused-vars': ['error', { 'args': 'none', 'caughtErrors': 'none' }],
            'require-atomic-updates': 'off',
            // were part of eslint:recommended in ESLint 8
            'no-extra-semi': 'error',
            'no-mixed-spaces-and-tabs': 'error',
            // added to eslint:recommended after ESLint 8, not enforced here
            'no-useless-assignment': 'off',
            'no-unassigned-vars': 'off',
            'preserve-caught-error': 'off',
            'keyword-spacing': ['error', { 'before': true, 'after': true }],
            'space-before-blocks': ['error'],
            'no-trailing-spaces': ['error', { 'ignoreComments': true }],
            'no-multiple-empty-lines': [2, { 'max': 1, 'maxEOF': 1 }],
        },
    },
];
