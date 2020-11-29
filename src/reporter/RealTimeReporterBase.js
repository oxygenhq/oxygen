import ReporterBase from './ReporterBase';

export default class RealTimeReporterBase extends ReporterBase {
    constructor(options) {
        super(options);
    }

    onStepStart() {
        throw new Error('Not implemented');
    }

    onStepEnd() {
        throw new Error('Not implemented');
    }
}