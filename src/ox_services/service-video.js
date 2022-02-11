import OxygenService from '../core/OxygenService';
import path from 'path';
import glob from 'glob';
import fs from 'fs';
import { path as ffmpegPath} from '@ffmpeg-installer/ffmpeg';
import { spawn } from 'child_process';

const allowedModules = ['web'];

export default class VideoService extends OxygenService {
    constructor(options, ctx, results, logger) {
        super(options, ctx, results, logger);

        this.enabled = options.video || false;
        this.videoFolderPath = path.join(options.cwd, 'video');
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
    }
    async onAfterCase(module) {
        if (this.enabled && allowedModules.includes(module.name)) {
            this.results.video = await this._generateVideo();
        }
    }
    _generateVideo() {
        const testname = 'video'+ +new Date();
        const videoPath = path.resolve(this.videoFolderPath, testname + '.mp4');
        const videoSlowdownMultiplier = 30;

        const command = `"${ffmpegPath}"`;
        const args = [
            '-y',
            '-r', '10',
            '-i', `"${this.videoFolderPath}${path.sep}%04d.png"`,
            '-vcodec', 'libx264',
            '-crf', '32',
            '-pix_fmt', 'yuv420p',
            '-vf', `"scale=1200:trunc(ow/a/2)*2","setpts=${videoSlowdownMultiplier}.0*PTS"`,
            `"${videoPath}"`,
        ];

        console.log(`ffmpeg command: ${command + ' ' + args}\n`);

        const cp = spawn(command, args, {
            // stdio: 'ignore',
            shell: true,
            windowsHide: true,
        });

        cp.on('error', (e) => {
            this.logger.error('Failed to init ffmpeg' + e);
        });

        // cp.stdout.on('data', (data) => {
        //     this._logBuffer(data, 'ffmpeg stdout: ');
        // });

        // cp.stderr.on('data', (data) => {
        //     this._logBuffer(data, 'ffmpeg stderr: ');
        // });

        return new Promise((resolve, reject) => {
            cp.on('close', (code, signal) => {
                const pngFiles = glob.sync(`${this.videoFolderPath}${path.sep}*.png`);

                if (
                    pngFiles &&
                    Array.isArray(pngFiles) &&
                    pngFiles.length > 0
                ) {
                    pngFiles.map(fs.unlinkSync);
                }

                resolve(videoPath);
            });
        });
    }
    _logBuffer (buffer, prefix) {
        const lines = buffer.toString().trim().split('\n');
        lines.forEach((line) => {
            this.logger.debug(prefix + line);
        });
    }
}