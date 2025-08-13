"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERRORS = exports.LOG_CONFIG = exports.ENV = void 0;
// src/config/env.ts
var dotenv_1 = require("dotenv");
var zod_1 = require("zod");
dotenv_1.default.config();
var baseSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["dev", "prod", "test"]).default("dev"),
    PORT: zod_1.z.string().refine(function (v) {
        var n = Number(v);
        return Number.isInteger(n) && n >= 1 && n <= 65535;
    }, 'port must be an integer between 1 and 65535'),
    DB_HOST: zod_1.z.string().min(1, 'db_host is required'),
    DB_PORT: zod_1.z.string().refine(function (v) {
        var n = Number(v);
        return Number.isInteger(n) && n >= 1 && n <= 65535;
    }, 'db_port must be an integer between 1 and 65535'),
    DB_USER: zod_1.z.string().min(1, 'db_user is required'),
    DB_PASSWORD: zod_1.z.string().min(1, 'db_password is required'),
    DB_NAME: zod_1.z.string().min(1, 'db_name is required'),
    DB_CONNECTION_INTERVAL: zod_1.z.string().refine(function (v) {
        var n = Number(v);
        return Number.isInteger(n) && n > 0;
    }, 'db_connection_interval must be a positive integer (ms)'),
    LOG_LEVEL: zod_1.z.string().optional(),
    LOG_DIR: zod_1.z.string().optional(),
    LOG_FILE: zod_1.z.string().optional(),
}).transform(function (env) {
    var fullDbName = "".concat(env.DB_NAME, "_").concat(env.NODE_ENV);
    var dbUri = "postgresql://".concat(encodeURIComponent(env.DB_USER), ":").concat(encodeURIComponent(env.DB_PASSWORD), "@").concat(env.DB_HOST, ":").concat(env.DB_PORT, "/").concat(fullDbName);
    return __assign(__assign({}, env), { DB_NAME: fullDbName, DB_URI: dbUri });
}).refine(function (env) {
    return /^postgresql:\/\/.+:.+@.+:\d+\/.+$/.test(env.DB_URI);
}, { message: 'DB_URI is not a valid PostgresSQL connection string' });
var parsed = baseSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ invalid environment variables:');
    for (var _i = 0, _d = parsed.error.issues; _i < _d.length; _i++) {
        var issue = _d[_i];
        console.error('-', issue.path.join('.'), ':', issue.message);
    }
    process.exit(1);
}
exports.ENV = parsed.data;
exports.LOG_CONFIG = {
    NODE_ENV: exports.ENV.NODE_ENV,
    LOG_LEVEL: (_a = exports.ENV.LOG_LEVEL) !== null && _a !== void 0 ? _a : (exports.ENV.NODE_ENV === "prod" ? "info" : "debug"),
    LOG_DIR: (_b = exports.ENV.LOG_DIR) !== null && _b !== void 0 ? _b : "logs",
    LOG_FILE: (_c = exports.ENV.LOG_FILE) !== null && _c !== void 0 ? _c : "app.log",
};
exports.ERRORS = {
    MISSING_VALS_OR_MODE_ERR: 'missing "values" / "mode"',
    MISSING_TYPE: 'missing "url" / "ip" / "port"',
    MODE_NAME_ERR: 'mode can be "blacklist" / "whitelist"',
    VALS_ERR: 'expected an array of valid',
};
