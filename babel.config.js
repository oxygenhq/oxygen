module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 8
            }
        }]
    ],
    plugins: [
        '@babel/plugin-proposal-function-bind',
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-optional-catch-binding'
    ],
    env: {
        development: {
            sourceMaps: true, //'inline',
//            plugins: ['source-map-support']
        }
    },
    overrides: [{
        test: '**/src/ox_modules/**/*.js',
        comments: true
    }],
    ignore: [
        '**/src/lib/logger.js'
    ],
    comments: false
}
