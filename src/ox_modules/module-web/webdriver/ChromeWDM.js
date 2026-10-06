const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
import got from 'got';
const extractZip = require('extract-zip');
const os = require('os');
const { pipeline } = require('stream/promises');

function getOxygenCacheDir(cacheDir) {
    const name = 'oxygen-nodejs';
    // An explicitly configured location always wins. Every default below lives under the
    // user profile, and enterprise Windows policies routinely make that non-writable -
    // those setups need somewhere else to put the driver entirely.
    const configured = cacheDir || process.env.OXYGEN_CACHE_DIR;
    if (configured) {
        return configured;
    }
    if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
        return path.join(localAppData, name, 'Cache');
    }
    if (process.platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Caches', name);
    }
    return path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), name);
}

function getDriversDir(cacheDir) {
    const driversDir = path.join(getOxygenCacheDir(cacheDir), 'drivers');
    // Created on demand rather than at import time. This used to run as a side effect of
    // importing the module, so on a profile without write permission it threw EPERM
    // before anything could report which directory was at fault - and before --autowd
    // was even consulted, so it fired for runs that needed no driver at all.
    if (!fs.existsSync(driversDir)) {
        fs.mkdirSync(driversDir, { recursive: true });
    }
    return driversDir;
}

export class ChromeWebDriverManager {
    constructor(options = {}) {
        this.wdCacheDir = options.wdCacheDir;
        // A driver the user installed themselves - a binary, or a folder holding one or
        // more. Closed networks cannot reach the Chrome for Testing endpoints at all, so
        // this is how --autowd works there. Precedence: --wdpath, then webDriverPath in
        // oxygen.conf.js (both arrive as options), then OXYGEN_CHROMEDRIVER_PATH.
        this.userDriverPath = options.webDriverPath || process.env.OXYGEN_CHROMEDRIVER_PATH || null;
    }
    async start() {
        if (this.userDriverPath) {
            // Resolved before the cache directory is touched: an offline machine is often
            // also a locked-down one, and creating a cache it will never use could fail.
            this.chromeDriverPath = resolveUserDriver(this.userDriverPath);
        } else {
            const driversDir = getDriversDir(this.wdCacheDir);
            const cachedPath = path.join(driversDir, getChromeDriverName());
            this.chromeDriverPath = await ensureCompatibleChromeDriver(driversDir, cachedPath);
        }
        const port = getRandomPort();
        this.proc = await startChromeDriver(this.chromeDriverPath, port, false);
        const remoteUrl = `http://localhost:${port}`;
        return { remoteUrl, proc: this.proc };
    }
    stop() {

    }
}

function resolveUserDriver(userPath) {
    const source = '(given by --wdpath, webDriverPath or OXYGEN_CHROMEDRIVER_PATH)';
    if (!fs.existsSync(userPath)) {
        throw new Error(`ChromeDriver not found at '${userPath}' ${source}`);
    }
    if (!fs.statSync(userPath).isDirectory()) {
        // An explicit binary is used as-is: the user chose it, and refusing it over a
        // version mismatch would leave them with no way forward offline.
        console.log(`Using ChromeDriver: ${userPath}`);
        return userPath;
    }

    // A folder may hold several drivers (one per Chrome version the team supports), so
    // pick the one matching the installed Chrome rather than whichever comes first.
    const candidates = findDriversInFolder(userPath);
    if (candidates.length === 0) {
        throw new Error(`No ${getChromeDriverName()} found in '${userPath}' or its subfolders ${source}`);
    }
    const chromeVersion = getChromeVersion();
    const found = candidates.map(p => ({ path: p, version: getCurrentChromeDriverVersion(p) }));
    const match = found.find(d => d.version && areVersionsCompatible(chromeVersion, d.version));
    if (!match) {
        const list = found.map(d => `${d.path} (${d.version || 'version unknown'})`).join(', ');
        throw new Error(
            `None of the ChromeDrivers in '${userPath}' match Chrome ${chromeVersion}. ` +
            `Found: ${list}. Add a ChromeDriver ${chromeVersion.split('.')[0]}.x to that folder.`
        );
    }
    console.log(`Using ChromeDriver ${match.version}: ${match.path}`);
    return match.path;
}

function findDriversInFolder(dir, depth = 2) {
    // Shallow on purpose: covers the folder itself, the cache layout (drivers/) and the
    // layout of an extracted download or per-version folders (chromedriver-win64/,
    // 153/chromedriver-win64/), without crawling a whole share.
    const results = [];
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
        return results;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isFile() && entry.name === getChromeDriverName()) {
            results.push(full);
        } else if (entry.isDirectory() && depth > 0) {
            results.push(...findDriversInFolder(full, depth - 1));
        }
    }
    return results;
}

function getChromeVersion() {
    try {
        // Try different methods to get Chrome version
        const commands = [
            'google-chrome --version',
            'google-chrome-stable --version',
            '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --version',
            'reg query "HKEY_CURRENT_USER\\Software\\Google\\Chrome\\BLBeacon" /v version',
            'chromium --version',
        ];

        for (const cmd of commands) {
            try {
                const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
                const match = output.match(/(\d+\.\d+\.\d+\.\d+)/);
                if (match) {
                    return match[1];
                }
            } catch (e) {
                continue;
            }
        }

        throw new Error('Could not detect Chrome version');
    } catch (error) {
        throw new Error(`Failed to get Chrome version: ${error.message}`);
    }
}

function getCurrentChromeDriverVersion(chromeDriverPath) {
    try {
        if (!fs.existsSync(chromeDriverPath)) {
            return null;
        }

        const output = execSync(`"${chromeDriverPath}" --version`, {
            encoding: 'utf8',
            stdio: 'pipe'
        });
        const match = output.match(/(\d+\.\d+\.\d+\.\d+)/);
        return match ? match[1] : null;
    } catch (error) {
        return null;
    }
}

function getChromeDriverName() {
    const platform = os.platform();
    if (platform === 'win32') {
        return 'chromedriver.exe';
    }
    return 'chromedriver';
}

function getPlatformKey() {
    const platform = os.platform();
    const arch = os.arch();

    if (platform === 'win32') {
        return arch === 'x64' ? 'win64' : 'win32';
    } else if (platform === 'linux') {
        return 'linux64';
    } else if (platform === 'darwin') {
        // MacOS has arm64 and x64 architectures
        return arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
    }

    throw new Error(`Unsupported platform: ${platform}`);
}

async function getCompatibleChromeDriverUrl(chromeVersion) {
    try {
        // Download JSON data with versions and downloads
        const jsonUrl = 'https://googlechromelabs.github.io/chrome-for-testing/latest-patch-versions-per-build-with-downloads.json';
        // ChromeDriver API endpoint for version mapping
        const jsonData = await got(jsonUrl).json();
        // Extract major version for API lookup
        const versionParts = chromeVersion.split('.');
        const majorVersion = versionParts[0];
        const minorVersion = versionParts[1];
        const build = versionParts[2];
        const buildKey = `${majorVersion}.${minorVersion}.${build}`;
        // Find matching build data
        let buildData = jsonData.builds[buildKey];
        // If exact build not found, try to find the closest major version
        if (!buildData) {
            const availableBuilds = Object.keys(jsonData.builds);
            const matchingBuilds = availableBuilds.filter(build => build.startsWith(`${majorVersion}.`));

            if (matchingBuilds.length === 0) {
                throw new Error(`No ChromeDriver builds found for Chrome major version ${majorVersion}`);
            }

            // Use the latest available build for this major version
            buildData = jsonData.builds[matchingBuilds[matchingBuilds.length - 1]];
            console.log(`Using ChromeDriver version: ${buildData.version}`);
        }
        // Get platform key
        const platformKey = getPlatformKey();
        console.log(`Platform detected: ${platformKey}`);

        // Find ChromeDriver download matching platform
        if (!buildData.downloads || !buildData.downloads.chromedriver) {
            throw new Error(`No ChromeDriver downloads available for build ${buildKey}`);
        }
        const chromedriverEntry = buildData.downloads.chromedriver.find(entry => entry.platform === platformKey);
        if (!chromedriverEntry) {
            throw new Error(`No ChromeDriver download found for platform '${platformKey}' in build ${buildKey}`);
        }
        console.log(`Compatible ChromeDriver version: ${buildData.version}`);
        return { version: buildData.version, url: chromedriverEntry.url };
    } catch (error) {
        throw new Error(`Failed to get compatible ChromeDriver version: ${error.message}`);
    }
}

function lastSegmentWithoutZip(urlStr) {
    const u = new URL(urlStr); // parses URLs reliably
    // split pathname into segments and take the last non-empty one
    const segments = u.pathname.split('/').filter(Boolean);
    const last = segments.pop() || '';
    // remove a .zip suffix (case-sensitive by default)
    return last.endsWith('.zip') ? last.slice(0, -4) : last;
}

async function downloadChromeDriver(chromeVersion, driversDir, chromeDriverPath) {
    // Get compatible ChromeDriver version
    const { version, url } = await getCompatibleChromeDriverUrl(chromeVersion);
    console.log('Downloading ChromeDriver...');

    try {
        // Download ChromeDriver
        const zipPath = path.join(driversDir, 'chromedriver.zip');
        // pipeline() propagates errors from the download side too - with a bare pipe()
        // a dropped connection left this waiting forever for a 'finish' that never came.
        await pipeline(got.stream(url), fs.createWriteStream(zipPath));

        // Extract ChromeDriver
        await extractZip(zipPath, { dir: driversDir });

        // The downloaded chromedriver will be extracted into a sub-directory
        // with name of the downloaded ZIP file
        const unzippedFolderName = lastSegmentWithoutZip(url);
        const unzippedFolderPath = path.join(driversDir, unzippedFolderName);
        const unzippedChromeDriverFilePath = path.join(unzippedFolderPath, getChromeDriverName());

        // Copy unzipped chromedriver file to a destination location
        fs.copyFileSync(unzippedChromeDriverFilePath, chromeDriverPath);

        // Make executable (Unix systems)
        if (process.platform !== 'win32') {
            execSync(`chmod +x "${chromeDriverPath}"`);
        }

        // Clean up zip file
        fs.unlinkSync(zipPath);
        fs.rmdirSync(unzippedFolderPath, { recursive: true, force: true });

        console.log(`ChromeDriver ${version} installed successfully`);
    } catch (error) {
        console.log(error);
        throw new Error(`Failed to download ChromeDriver: ${error.message}`);
    }
}

async function ensureCompatibleChromeDriver(driversDir, chromeDriverPath) {
    console.log('Checking Chrome and ChromeDriver compatibility...');

    // Get Chrome version
    const chromeVersion = getChromeVersion();
    console.log(`Chrome version: ${chromeVersion}`);

    // Get current ChromeDriver version
    const currentDriverVersion = getCurrentChromeDriverVersion(chromeDriverPath);
    console.log(`Current ChromeDriver version: ${currentDriverVersion || 'Not installed'}`);

    if (currentDriverVersion && areVersionsCompatible(chromeVersion, currentDriverVersion)) {
        console.log('ChromeDriver is compatible with current Chrome version');
        return chromeDriverPath;
    }

    // A matching chromedriver already on PATH needs no download, which is what lets a
    // machine without internet access work once IT has installed the driver.
    const pathDriver = findCompatibleDriverOnPath(chromeVersion);
    if (pathDriver) {
        console.log(`Using ChromeDriver from PATH: ${pathDriver}`);
        return pathDriver;
    }

    console.log('ChromeDriver update required');
    try {
        await downloadChromeDriver(chromeVersion, driversDir, chromeDriverPath);
    } catch (e) {
        const major = chromeVersion.split('.')[0];
        throw new Error(
            `${e.message}\n` +
            `No ChromeDriver ${major}.x is available locally and it could not be downloaded ` +
            '(the machine may have no internet access). Install a ChromeDriver matching ' +
            `Chrome ${chromeVersion}, then pass --wdpath=<chromedriver or folder of drivers>, ` +
            'set webDriverPath in oxygen.conf.js or OXYGEN_CHROMEDRIVER_PATH, put it on PATH, or copy it to ' +
            `'${chromeDriverPath}'.`
        );
    }
    return chromeDriverPath;
}

function findCompatibleDriverOnPath(chromeVersion) {
    const name = getChromeDriverName();
    const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
    for (const dir of dirs) {
        const candidate = path.join(dir, name);
        const version = getCurrentChromeDriverVersion(candidate);
        if (version && areVersionsCompatible(chromeVersion, version)) {
            return candidate;
        }
    }
    return null;
}

function areVersionsCompatible(chromeVersion, driverVersion) {
    // Chrome and ChromeDriver should have the same major version
    const chromeMajor = chromeVersion.split('.')[0];
    const driverMajor = driverVersion.split('.')[0];

    return chromeMajor === driverMajor;
}

async function startChromeDriver(chromeDriverPath, port, debug = false) {
    return new Promise((resolve, reject) => {
        console.log(`🔧 Starting ChromeDriver on port ${port}...`);

        // ChromeDriver arguments
        const args = [
            `--port=${port}`,
            '--whitelisted-ips=',
            '--disable-dev-shm-usage'
        ];

        if (debug) {
            args.push('--verbose');
        }

        // Spawn ChromeDriver process
        const proc = spawn(chromeDriverPath, args, {
            stdio: debug ? 'inherit' : 'pipe'
        });

        // With stdio 'pipe' the process's own explanation for a crash (missing shared
        // library, port already bound by something else, etc.) goes nowhere unless we
        // read it - capture it so a crash is actually diagnosable instead of showing up
        // as a bare exit code.
        let output = '';
        if (!debug) {
            proc.stdout?.on('data', (data) => { output += data.toString(); });
            proc.stderr?.on('data', (data) => { output += data.toString(); });
        }

        // Both the 'exit' handler and the readiness poll below can independently decide
        // the outcome; settle only once so an exit after a resolved/rejected promise
        // (or vice versa) can't call resolve/reject twice.
        let settled = false;

        // Handle process events
        proc.on('error', (error) => {
            if (settled) {
                return;
            }
            settled = true;
            reject(new Error(`Failed to start ChromeDriver: ${error.message}`));
        });

        proc.on('exit', (code, signal) => {
            if (code !== null && code !== 0) {
                console.log(`ChromeDriver exited with code ${code}`);
                if (output.trim()) {
                    console.log(`ChromeDriver output:\n${output.trim()}`);
                }
                // Fail fast instead of waiting out the full readiness-poll timeout for a
                // process that has already died.
                if (!settled) {
                    settled = true;
                    reject(new Error(
                        `ChromeDriver exited with code ${code} before it became ready.` +
                        (output.trim() ? ` Output: ${output.trim()}` : '')
                    ));
                }
            }
            if (signal) {
                console.log(`ChromeDriver killed with signal ${signal}`);
            }
        });

        // Wait for ChromeDriver to be ready
        waitForChromeDriverReady(port)
            .then(() => {
                if (settled) {
                    return;
                }
                settled = true;
                console.log(`✅ ChromeDriver started successfully on port ${port}`);
                resolve(proc);
            })
            .catch((error) => {
                if (settled) {
                    return;
                }
                settled = true;
                reject(error);
            });
    });
}

async function waitForChromeDriverReady(port, maxRetries = 30, interval = 1000) {
    const checkUrl = `http://localhost:${port}/status`;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const body = await got(checkUrl, { timeout: { request: 2000 } }).json();
            if (body.value && body.value.ready) {
                return true;
            }
        } catch (error) {
            // ChromeDriver not ready yet, continue waiting
        }

        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`ChromeDriver did not become ready within ${maxRetries * interval}ms`);
}

function getRandomPort() {
    // Generate random port between 9000-9999 to avoid conflicts
    return Math.floor(Math.random() * 1000) + 9000;
}