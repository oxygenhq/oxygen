const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const envPaths = require('env-paths');
const axios = require('axios');
const extractZip = require('extract-zip');
const os = require('os');

const paths = envPaths('oxygen');
const driversDir = path.join(paths.cache, 'drivers');
const chromeDriverPath = path.join(driversDir, getChromeDriverName());
if (!fs.existsSync(driversDir)) {
    fs.mkdirSync(driversDir, { recursive: true });
}

export class ChromeWebDriverManager {
    async start() {
        await ensureCompatibleChromeDriver();
        const port = getRandomPort();
        this.proc = await startChromeDriver(port, false);
        const remoteUrl = `http://localhost:${port}`;
        return { remoteUrl, proc: this.proc };
    }
    stop() {

    }
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

function getCurrentChromeDriverVersion() {
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
        const response = await axios.get(jsonUrl);
        //fs.writeFileSync('/tmp/data.json', JSON.stringify(response.data));
        const jsonData = response.data;
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

async function downloadChromeDriver(chromeVersion) {
    // Get compatible ChromeDriver version
    const { version, url } = await getCompatibleChromeDriverUrl(chromeVersion);
    console.log('Downloading ChromeDriver...');

    try {
        // Download ChromeDriver
        const response = await axios.get(url, { responseType: 'stream' });
        const zipPath = path.join(driversDir, 'chromedriver.zip');

        const writer = fs.createWriteStream(zipPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

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

async function ensureCompatibleChromeDriver() {
    console.log('Checking Chrome and ChromeDriver compatibility...');

    // Get Chrome version
    const chromeVersion = getChromeVersion();
    console.log(`Chrome version: ${chromeVersion}`);

    // Get current ChromeDriver version
    const currentDriverVersion = getCurrentChromeDriverVersion();
    console.log(`Current ChromeDriver version: ${currentDriverVersion || 'Not installed'}`);

    // Check if update is needed
    if (!currentDriverVersion || !areVersionsCompatible(chromeVersion, currentDriverVersion)) {
        console.log('ChromeDriver update required');
        await downloadChromeDriver(chromeVersion);
    } else {
        console.log('ChromeDriver is compatible with current Chrome version');
    }
}

function areVersionsCompatible(chromeVersion, driverVersion) {
    // Chrome and ChromeDriver should have the same major version
    const chromeMajor = chromeVersion.split('.')[0];
    const driverMajor = driverVersion.split('.')[0];

    return chromeMajor === driverMajor;
}

async function startChromeDriver(port, debug = false) {
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

        // Handle process events
        proc.on('error', (error) => {
            reject(new Error(`Failed to start ChromeDriver: ${error.message}`));
        });

        proc.on('exit', (code, signal) => {
            if (code !== null && code !== 0) {
                console.log(`ChromeDriver exited with code ${code}`);
            }
            if (signal) {
                console.log(`ChromeDriver killed with signal ${signal}`);
            }
        });

        // Wait for ChromeDriver to be ready
        waitForChromeDriverReady(port)
            .then(() => {
                console.log(`✅ ChromeDriver started successfully on port ${port}`);
                resolve(proc);
            })
            .catch(reject);
    });
}

async function waitForChromeDriverReady(port, maxRetries = 30, interval = 1000) {
    const checkUrl = `http://localhost:${port}/status`;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios.get(checkUrl, { timeout: 2000 });
            if (response.status === 200 && response.data.value && response.data.value.ready) {
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