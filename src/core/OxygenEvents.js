import { EventEmitter } from 'events';
import oxutil from '../lib/util';

export default class OxygenEvents extends EventEmitter {
    constructor () {
        super();
    }

    emitBeforeCommand(cmdName, moduleName, cmdFn, cmdArgs, ctx, location, startTime, { id = null, parentId = null }) {
        this.emit('command:before', {
            name: cmdName,
            module: moduleName,
            args: cmdArgs,
            signature: oxutil.getMethodSignature(moduleName, cmdName, cmdArgs),
            ctx: ctx,
            time: startTime,
            location: location,
        });
    }

    emitAfterCommand(cmdName, moduleName, cmdFn, cmdArgs, ctx, location, endTime, result, { id = null, parentId = null }) {
        this.emit('command:after', {
            name: cmdName,
            module: moduleName,
            args: cmdArgs,
            signature: oxutil.getMethodSignature(moduleName, cmdName, cmdArgs),
            ctx: ctx,
            time: endTime,
            location: location,
            result: result,
        });
    }

    emitBeforeStep(step) {
        this.emit('step:before', step);
    }

    emitAfterStep(step, status = null, error = null) {
        if (step) {
            this.emit('step:after', step);   
        }
        else {
            this.emit('step:after', {
                _id: null,
                _parentId: null,
                name: null,
                status: status,
                error: error
            });
        }
    }

    emitLog(time, level, msg, args, src) {
        this.emit('log', {
            time: time,
            level: level,
            message: msg,
            args: args,
            src: src,
        });
    }
}
