import OxygenService from '../core/OxygenService';
import path from 'path';

const allowedModules = ['web'];

export default class VideoService extends OxygenService {
    constructor(options, ctx, results, logger) {
        super(options, ctx, results, logger);
        this.enabled = options.enableVideo || false;
        this.videoFolderPath = options.videoFolderPath || null;
        this.results = results;
        this.logger = logger;
    }
    logBuffer (buffer, prefix) {
        const lines = buffer.toString().trim().split('\n');
        lines.forEach((line) => {
            this.logger.debug(prefix + line);
        });
    }
    onBeforeCase(context, module) {
        if (this.enabled && allowedModules.includes(module.name)) {
            let name = +new Date();
            if (
                context &&
                context.test &&
                context.test.suite &&
                context.test.case
            ) {
                name = context.test.suite.name + '_' + context.test.suite.iteration + '_' + context.test.case.name + '_' + context.test.case.iteration;
            }

            this.videoPath = path.join(this.videoFolderPath, name+'.mp4');
            const { spawn } = require('child_process');
            try {
                this.ffmpeg = spawn('ffmpeg', [
                    '-f',
                    'gdigrab',
                    '-framerate',
                    10,
                    '-i',
                    'desktop',
                    this.videoPath, // Output file
                    '-y', // Overwrite output files without asking
                    '-loglevel',
                    'error', // Log only errors
                ]);
                this.ffmpeg.on('error', (e) => {
                    this.logger.error('Failed to init ffmpeg' + e);
                });
            } catch (e) {
                this.logger.error('Failed to init ffmpeg' + e);
            }

            this.ffmpeg.stdout.on('data', (data) => {
                this.logBuffer(data, 'ffmpeg stdout: ');
            });

            this.ffmpeg.stderr.on('data', (data) => {
                this.logBuffer(data, 'ffmpeg stderr: ');
            });

            this.ffmpeg.on('close', (code, signal) => {
                this.logger.debug('Video location:', this.videoPath, '\n');
                if (code !== null) {
                    this.logger.debug(`ffmpeg exited with code ${code} ${this.videoPath}`);
                }
                if (signal !== null) {
                    this.logger.debug(`ffmpeg received signal ${signal} ${this.videoPath}`);
                }
            });
        }
    }
    onAfterCase(module) {
        if (this.enabled && allowedModules.includes(module.name)) {
            if (this.ffmpeg) {
                this.ffmpeg.kill('SIGINT');
            }
            this.results.video = this.videoPath;
        }
    }
}