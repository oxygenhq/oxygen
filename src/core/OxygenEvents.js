import { EventEmitter } from 'events';

export default class OxygenEvents extends EventEmitter {
    constructor () {
        super();
    }

    emitBeforeCommand(cmdName, moduleName, cmdFn, cmdArgs, ctx, location, startTime) {
        this.emit('command:before', {
            name: cmdName,
            module: moduleName, 
            args: cmdArgs,
            ctx: ctx,
            time: startTime,
            location: location,
        });
    }

    emitAfterCommand(cmdName, moduleName, cmdFn, cmdArgs, ctx, location, endTime, result) {
        this.emit('command:after', {
            name: cmdName,
            module: moduleName, 
            args: cmdArgs,
            ctx: ctx,
            time: endTime,
            location: location,
            result: result,
        });
    }
}
