export function measure(name, value, opts = {}) {
    const step = this.startStep(name, 'measurement');
    step.meta = {
        value: value || null,
        unit: opts.unit || null,
        avg: opts.avg || null,
        min: opts.min || null,
        max: opts.max || null,
    };
    this.endStep(STATUS.PASSED);
}