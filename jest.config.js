export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    testMatch: ['**/src/tests/**/*.test.ts'],
    testPathIgnorePatterns: [],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/tests/**',
        '!src/scripts/**'
    ],
    forceExit: true,
    silent: true,
    verbose: false,
    detectOpenHandles: true
};
