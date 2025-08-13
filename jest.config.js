export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1' // נדרש ל-module=nodenext
    },
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            { useESM: true }
        ]
    },
    testMatch: ['<rootDir>/**/*.test.ts'], // 👈 ודא ש-Jest אוסף את הטסטים מהתיקייה
    roots: ['<rootDir>/src/tests'],

    setupFiles: ['dotenv/config'] // 👈 יטען .env לפני כל טסט
};
