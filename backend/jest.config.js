export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/src/tests/testSetup.ts'],
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
    silent: false,
    verbose: true,
    detectOpenHandles: true,
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            useESM: true
        }]
    }
};
