/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset:          'ts-jest',
  testEnvironment: 'node',
  roots:           ['<rootDir>/tests'],
  testMatch:       ['**/*.test.ts'],
  testTimeout:     30000,
  forceExit:       true,
  verbose:         true,
  globals: {
    'process.env': { NODE_ENV: 'test' }, // ← belt-and-suspenders safety
  },
};
