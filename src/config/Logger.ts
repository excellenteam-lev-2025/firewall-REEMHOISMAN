// src/utils/logger.ts
import fs from "fs";
import path from "path";
import winston from "winston";
import { LOG_CONFIG } from "./env.js";

let logger: winston.Logger;

const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level}: ${message}`;
    })
);

const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

function initLogger(): winston.Logger {
    if (logger) return logger;

    const isDev = LOG_CONFIG.NODE_ENV === "development";
    const transports: winston.transport[] = [];

    if (isDev) {
        transports.push(new winston.transports.Console());
    } else {
        fs.mkdirSync(LOG_CONFIG.LOG_DIR, { recursive: true });
        transports.push(
            new winston.transports.File({
                filename: path.join(LOG_CONFIG.LOG_DIR, LOG_CONFIG.LOG_FILE),
                maxsize: 10 * 1024 * 1024,
                maxFiles: 5
            })
        );
    }

    logger = winston.createLogger({
        level: LOG_CONFIG.LOG_LEVEL,
        format: isDev ? devFormat : prodFormat,
        transports
    });

    patchConsole(logger);
    logger.info(`logger initialized (${LOG_CONFIG.NODE_ENV}) → ${isDev ? "console" : "file"}`);

    return logger;
}

function patchConsole(lg: winston.Logger) {
    console.log = (...args: any[]) => lg.info(args.join(" "));
    console.info = (...args: any[]) => lg.info(args.join(" "));
    console.warn = (...args: any[]) => lg.warn(args.join(" "));
    console.error = (...args: any[]) => lg.error(args.join(" "));
    console.debug = (...args: any[]) => lg.debug(args.join(" "));
}

initLogger();

export { logger };
