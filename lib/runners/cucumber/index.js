import * as Cucumber from 'cucumber'
import mockery from 'mockery'
import isGlob from 'is-glob'
import glob from 'glob'
import path from 'path'

import {
    wrapCommand,
    executeHooksWithArgs,
    executeSync,
    executeAsync
} from '@wdio/sync' //'wdio-sync'

//import HookRunner from './hookRunner'
import { EventEmitter } from 'events'

import CucumberEventListener from './cucumber-event-listener'
import CucumberReporter from './reporter'
import Oxygen from '../../core'

require('@babel/register')({
    // Find babel.config.js up the folder structure.
    //rootMode: 'upward',
  
    // Since babel ignores all files outside the cwd, it does not compile sibling packages
    // So rewrite the ignore list to only include node_modules
    ignore: ['node_modules'],
    //presets: [['@babel/preset-env', {targets: {node: 'current'}, useBuiltIns: 'entry'}]],
    presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
    plugins: ["@babel/plugin-transform-modules-commonjs"]
  });
/*require('@babel/register')({
    presets: [ "@babel/preset-env" ]
})*/
/*require("@babel/register")({
    //presets: [["env", {"modules": false}]], //"commonjs"
    presets: [['@babel/preset-env', {targets: {node: 'current'}, useBuiltIns: 'entry'}]],
    plugins: ["@babel/plugin-transform-modules-commonjs"]
});
require('@babel/polyfill');*/

const DEFAULT_TIMEOUT = 30000
const DEFAULT_OPTS = {
    backtrace: false, // <boolean> show full backtrace for errors
    compiler: [], // <string[]> ("extension:module") require files with the given EXTENSION after requiring MODULE (repeatable)
    failAmbiguousDefinitions: false, // <boolean> treat ambiguous definitions as errors
    failFast: false, // <boolean> abort the run on first failure
    ignoreUndefinedDefinitions: false, // <boolean> treat undefined definitions as warnings
    name: [], // <REGEXP[]> only execute the scenarios with name matching the expression (repeatable)
    profile: [], // <string> (name) specify the profile to use
    require: [], // <string> (file/dir/glob) require files before executing features
    order: 'defined', // <string> switch between deterministic  and random feature execution. Either "defined", "random" or "random:42" whereas 42 is the seed for randomization
    snippetSyntax: undefined, // <string> specify a custom snippet syntax
    snippets: true, // <boolean> hide step definition snippets for pending steps
    source: true, // <boolean> hide source uris
    strict: false, // <boolean> fail if there are any undefined or pending steps
    tagExpression: '', // <string> (expression) only execute the features or scenarios with tags matching the expression
    tagsInTitle: false, // <boolean> add cucumber tags to feature or scenario name
    timeout: DEFAULT_TIMEOUT // <number> timeout for step definitions in milliseconds
}

class LoggingEventEmitter extends CucumberEventListener {
    constructor(eventBroadcaster) {
        super(eventBroadcaster)
    }
    emit(type, ...args) {
        //console.log(`Event: ${type}`, JSON.stringify(args, null, 4))
        //super.emit(type, ...args)
    }
}
export default class CucumberRunner {
    constructor () {
        this.isInitialized = false
        this.cucumberEventListener = null
        this.cucumberReporter = null
        this.oxygen = null

        this.id = (new Date()).getTime()
        this.beforeCommandHandler = this.beforeCommandHandler.bind(this)
        this.afterCommandHandler = this.afterCommandHandler.bind(this)
        this.onBeforeFeature = this.onBeforeFeature.bind(this)
        this.onAfterFeature = this.onAfterFeature.bind(this)
        this.onTestEnd = this.onTestEnd.bind(this)
    }

    init(config, caps, reporter) {
        this.config = config
        this.cwd = this.config.cwd || process.cwd()
        this.specs = this.resolveSpecFiles(config.specs || [])
        this.capabilities = caps
        this.reporter = reporter
        this.isInitialized = true
        this.cucumberOpts = Object.assign(DEFAULT_OPTS, config.cucumberOpts)        
    }

    dispose() {
        this.isInitialized = false
    }

    async run () {

        this.reporter.onRunnerStart(this.id, this.config, this.capabilities)

        try {
            Cucumber.supportCodeLibraryBuilder.reset(this.cwd)

            await this.initializeOxygenCore()
    
            wrapCommand(this.beforeCommandHandler, this.afterCommandHandler)
    
            this.registerCompilers()
            this.loadRequireFiles()
            this.wrapSteps()
            Cucumber.setDefaultTimeout(this.cucumberOpts.timeout)
            const supportCodeLibrary = Cucumber.supportCodeLibraryBuilder.finalize()
    
            const eventBroadcaster = new EventEmitter()    
            this.hookInCucumberEvents(eventBroadcaster)
            this.cucumberReporter = new CucumberReporter(this.id, this.cucumberEventListener, this.oxygen, this.reporter, this.config)
            // eslint-disable-next-line no-new
            //new HookRunner(eventBroadcaster, this.config)
    
            const reporterOptions = {
                capabilities: this.capabilities,
                ignoreUndefinedDefinitions: Boolean(this.cucumberOpts.ignoreUndefinedDefinitions),
                failAmbiguousDefinitions: Boolean(this.cucumberOpts.failAmbiguousDefinitions),
                tagsInTitle: Boolean(this.cucumberOpts.tagsInTitle)
            }
            const reporter = null; // new CucumberReporter(eventBroadcaster, reporterOptions, this.cid, this.specs)
    
            const pickleFilter = new Cucumber.PickleFilter({
                featurePaths: this.specs,
                names: this.cucumberOpts.name,
                tagExpression: this.cucumberOpts.tagExpression
            })
            const testCases = await Cucumber.getTestCasesFromFilesystem({
                cwd: this.cwd,
                eventBroadcaster,
                featurePaths: this.specs.map(spec => spec.replace(/(:\d+)*$/g, '')),
                order: this.cucumberOpts.order,
                pickleFilter
            })
            //console.log('getTestCasesFromFilesystem - testCases', testCases)
            const runtime = new Cucumber.Runtime({
                eventBroadcaster,
                options: this.cucumberOpts,
                supportCodeLibrary,
                testCases
            })
    
            const beforeHookRetval = await executeHooksWithArgs(this.config.before, [this.capabilities, this.specs])
            // if beforeHookRetval contains some value, then this is an error thrown by 'before' method
            if (beforeHookRetval && Array.isArray(beforeHookRetval) && beforeHookRetval.length > 0 && beforeHookRetval[0]) {
                throw beforeHookRetval[0]
            }
            
            console.log('runtime.start')
            const result = await runtime.start() ? 0 : 1
            const afterHookRetval = await executeHooksWithArgs(this.config.after, [result, this.capabilities, this.specs])
            // if afterHookRetval contains some value, then this is an error thrown by 'after' method
            if (afterHookRetval && Array.isArray(afterHookRetval) && afterHookRetval.length > 0 && afterHookRetval[0]) {
                throw afterHookRetval[0]
            }
            //await reporter.waitUntilSettled()
            console.log('cucumber result', result)
    
            await this.disposeOxygenCore()
    
            this.reporter.onRunnerEnd(this.id, this.config, this.capabilities)
    
            return result
        }
        catch (e) {
            console.log('Fatal error in Cucumber runner.', e)
            this.reporter.onRunnerEnd(this.id, this.config, this.capabilities, e)
        }
    }

    async initializeOxygenCore() {
        if (!this.oxygen) {
            this.oxygen = new Oxygen()
            await this.oxygen.init(this.config, this.capabilities)
        }        
    }

    async disposeOxygenCore() {
        if (this.oxygen) {
            try {
                await this.oxygen.dispose()
            }
            catch (e) {
                console.error('Failed to dispose Oxygen modules.', e)
            }
            this.oxygen = null
        }
    }

    registerCompilers () {
        this.cucumberOpts.compiler.forEach(compiler => {
            if (compiler instanceof Array) {
                let parts = compiler[0].split(':')
                require(parts[1])(compiler[1])
            } else {
                let parts = compiler.split(':')
                require(parts[1])
            }
        })
    }

    requiredFiles () {
        return this.cucumberOpts.require.reduce((files, requiredFile) => {
            const absolutePath = this.getAbsolutePath(requiredFile)
            if (isGlob(absolutePath)) {
                return files.concat(glob.sync(absolutePath))
            } else {
                return files.concat([absolutePath])
            }
        }, [])
    }

    resolveSpecFiles (specs) {
        if (!Array.isArray(specs)) {
            return []
        }        
        return specs.reduce((files, specFile) => {
            const absolutePath = this.getAbsolutePath(specFile)
            if (isGlob(absolutePath)) {
                return files.concat(glob.sync(absolutePath))
            } else {
                return files.concat([absolutePath])
            }
        }, [])
    }

    getAbsolutePath(p) {
        let absolutePath
        if (path.isAbsolute(p)) {
            return p;
        } else {
            return path.join(this.cwd, p)
        }
    }

    loadRequireFiles () {
        // we use mockery to allow people to import 'our' cucumber even though their spec files are in their folders
        // because of that we don't have to attach anything to the global object, and the current cucumber spec files
        // should just work with no changes with this framework
        mockery.enable({
            useCleanCache: true,
            warnOnReplace: false,
            warnOnUnregistered: false
        })
        mockery.registerMock('cucumber', Cucumber)

        this.requiredFiles().forEach((codePath) => {
            // This allows rerunning a stepDefinitions file
            delete require.cache[require.resolve(codePath)]
            require(codePath)
        })
        mockery.disable()
    }

    beforeCommandHandler() {
        if (this.config.beforeCommand && typeof this.config.beforeCommand === 'function') {
            this.config.beforeCommand()
        }
    }

    afterCommandHandler() {
        if (this.config.afterCommand && typeof this.config.afterCommand === 'function') {
            this.config.afterCommand()
        }
    }
    /**
     * wraps step definition code with sync/async runner with a retry option
     */
    wrapSteps () {
        const sync = this.config.sync
        const wrapStepSync = this.wrapStepSync
        const wrapStepAsync = this.wrapStepAsync

        Cucumber.setDefinitionFunctionWrapper(function syncAsyncRetryWrapper (fn, options = {}) {
            //console.log('wrapSteps - step', fn)
            let retryTest = isFinite(options.retry) ? parseInt(options.retry, 10) : 0
            let wrappedFunction = fn.name === 'async' || sync === false
                ? wrapStepAsync(fn, retryTest) : wrapStepSync(fn, retryTest)
            return wrappedFunction
        })
    }

    /**
     * wrap step definition to enable retry ability
     * @param  {Function} code       step definitoon
     * @param  {Number}   retryTest  amount of allowed repeats is case of a failure
     * @return {Function}            wrapped step definiton for sync WebdriverIO code
     */
    wrapStepSync (code, retryTest = 0) {
        return function (...args) {
            return new Promise((resolve, reject) => global.wdioSync(
                executeSync.bind(this, code, retryTest, args),
                (resultPromise) => resultPromise.then(resolve, reject)
            ).apply(this))
        }
    }

    /**
     * wrap step definition to enable retry ability
     * @param  {Function} code       step definitoon
     * @param  {Number}   retryTest  amount of allowed repeats is case of a failure
     * @return {Function}            wrapped step definiton for async WebdriverIO code
     */
    wrapStepAsync (code, retryTest = 0) {
        return function (...args) {
            return executeAsync.call(this, code, retryTest, args)
        }
    }

    hookInCucumberEvents(eventBroadcaster) {
        this.cucumberEventListener = new CucumberEventListener(eventBroadcaster)
        this.cucumberEventListener.on('feature:before', this.onBeforeFeature)
        this.cucumberEventListener.on('feature:after', this.onAfterFeature)
        this.cucumberEventListener.on('scenario:before', this.onAfterFeature)
        this.cucumberEventListener.on('scenario:after', this.onAfterFeature)
        this.cucumberEventListener.on('step:before', this.onAfterFeature)
        this.cucumberEventListener.on('step:after', this.onAfterFeature)
        this.cucumberEventListener.on('test:end', this.onTestEnd)
    }

    onBeforeFeature() {
        //console.log('onBeforeFeature', arguments)
    }

    onAfterFeature() {
        //console.log('onAfterFeature', arguments)
    }

    onTestEnd() {
        console.log('onTestEnd', arguments)
    }
}
