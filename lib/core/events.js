import { EventEmitter } from 'events'

export default class OxygenEvents extends EventEmitter {
    constructor () {
        super()
    }

    emit(event, ...args) {
        super.emit(event, args);
    }

    emitBeforeCommand(cmdName, moduleName, cmdFn, cmdArgs, ctx, location, startTime) {
    }

    emitAfterCommand(cmdName, moduleName, cmdFn, cmdArgs, ctx, location, endTime, retval, error) {

    }
}
