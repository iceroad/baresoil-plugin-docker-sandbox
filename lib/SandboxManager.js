const _ = require('lodash'),
  json = JSON.stringify,
  spawn = require('child_process').spawn,
  spawnSync = require('child_process').spawnSync
  ;

const MIN_DOCKER_MAJOR_VERSION = 17;

class SandboxManager {
  checkSystem() {
    // Ensure that Docker is installed, available, and of an adequate version.
    let rv = spawnSync('docker -v', { shell: true, stdio: 'pipe' });
    if (rv.status !== 0) {
      throw new Error(
        'Cannot spawn "docker -v"; ensure that you have installed Docker ' +
          'Engine on your system.');
    }
    const dockerVerStr = rv.stdout.toString('utf-8');
    const dockerVer = dockerVerStr.match(/Docker version (\d+)/i);
    if (!dockerVer) {
      throw new Error(`Unrecognized Docker version: "${dockerVerStr}"`);
    }
    const dockerVerInt = parseInt(dockerVer[1], 10);
    if (dockerVerInt < MIN_DOCKER_MAJOR_VERSION) {
      throw new Error(
        `Unsupported Docker version found: ${dockerVerInt}; Docker CE ` +
          `v${MIN_DOCKER_MAJOR_VERSION} or higher required.`);
    }

    // Ensure that the default container image is available.
    const defaultContainerImage = this.config_.defaultContainer;
    const cmdLine = `docker images -q ${defaultContainerImage}`;
    rv = spawnSync(cmdLine, { shell: true, stdio: 'pipe' });
    if (rv.status !== 0) {
      throw new Error(`Cannot spawn "${cmdLine}": exit code ${rv.status}.`);
    }
    const imageIds = rv.stdout.toString('utf-8');
    if (!imageIds.match(/^[a-f0-9]+/i)) {
      throw new Error(
        `Cannot find default container image "${defaultContainerImage}"` +
          `; please run "docker pull ${defaultContainerImage}".`);
    }
  }

  spawnSandboxChild(baseConnection, appConfig) {
    const clientId = baseConnection.clientId;
    const config = this.config_;
    const syslibInterface = json(this.syslibInterface_);
    const driverPath = this.getSandboxDriverPath();
    const containerName = _.get(appConfig, 'sandbox.containerName', config.defaultContainer);
    const dockerArgs = [
      'run',
      '--read-only',
      '--rm',
      `--memory=${config.memoryBytes}`,
      `--cpus=${config.cpuCount}`,
      `--pids-limit=${config.maxChildProcesses}`,
      '--log-driver=none',
      '--security-opt=no-new-privileges',
      `--name=${clientId}`,
      `--tmpfs /tmp:rw,nodev,exec,nosuid,size=${config.tmpSizeBytes}`,
      '-v', `${driverPath}:/driver:ro`,
      '-e', json(`BASE_CONNECTION=${json(baseConnection)}`),
      '-e', json(`SYSLIB_INTERFACE=${json(syslibInterface)}`),
      '-e', json(`APP_ENV=${json(_.get(appConfig, 'sandbox.environment', []))}`),
      '--workdir=/tmp',
      '-i',
      `${containerName}`,
      '/usr/local/bin/node',
      '/driver/_init.js',
    ];

    const options = {
      stdio: 'pipe',
      shell: true,
    };

    console.debug(`Sandbox ${clientId} starting: docker ${dockerArgs.join(' ')}`);
    return spawn('docker', dockerArgs, options);
  }
}

SandboxManager.prototype.$spec = require('./SandboxManager.spec');

module.exports = SandboxManager;
