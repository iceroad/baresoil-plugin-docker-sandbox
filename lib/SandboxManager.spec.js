const constants = require('./constants'),
  os = require('os')
;

module.exports = {
  config: {
    type: 'object',
    desc: 'Options for a Docker-based sandbox implementation.',
    fields: {
      defaultContainer: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
      },
      memoryBytes: {
        type: 'integer',
        desc: 'Amount of memory to allocate to each sandbox.',
        minValue: 128 * constants.MEGABYTES,
        maxValue: 32 * constants.GIGABYTES,
      },
      network: {
        type: 'boolean',
        desc: 'True to enable network access for sandbox.',
      },
      virtualMemoryBytes: {
        type: 'integer',
        desc: 'Amount of virtual memory to allocate to each sandbox.',
        minValue: 32 * constants.MEGABYTES,
        maxValue: 32 * constants.GIGABYTES,
      },
      maxChildProcesses: {
        type: 'integer',
        desc: 'Maximum number of child processes sandbox can spawn.',
        minValue: 5,
        maxValue: 50,
      },
      cpuCount: {
        type: 'number',
        desc: 'Logical CPU cores to allocate to sandbox.',
        minValue: 1,
      },
      tmpSizeBytes: {
        type: 'integer',
        desc: 'Size of writable /tmp folder in bytes.',
        minValue: 0,
      },
    },
  },
  defaults: {
    defaultContainer: 'iceroad/baresoil-sandbox',
    memoryBytes: 512 * constants.MEGABYTES,
    network: true,
    virtualMemoryBytes: 2 * constants.GIGABYTES,
    maxChildProcesses: 25,
    cpuCount: Math.min(os.cpus().length, 2),
    tmpSizeBytes: 128 * constants.MEGABYTES,
  },
};
