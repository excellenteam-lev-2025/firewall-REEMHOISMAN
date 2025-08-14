// src/config/Logger.ts
import fs from "fs";
import path from "path";
import winston from "winston";
import { ENV } from "./env.js";

/**
 * Logger Singleton class
 * only one instance of the logger exists
 */
class Logger {
    private static instance: Logger;
    private readonly logger: winston.Logger;

    private constructor() {
        this.logger = this.initLogger();
        this.patchConsole();
    }

    /**
     * Gets the singleton instance of Logger
     * @returns Logger instance
     */
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Gets the winston logger instance
     * @returns winston.Logger
     */
    public getLogger(): winston.Logger {
        return this.logger;
    }

    private initLogger(): winston.Logger {
        const isDev = ENV.NODE_ENV === "dev";
        const transports: winston.transport[] = [];

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

        if (isDev) {
            transports.push(new winston.transports.Console());
        } else {
            fs.mkdirSync(ENV.LOG_DIR, { recursive: true });
            transports.push(
                new winston.transports.File({
                    filename: path.join(ENV.LOG_DIR, ENV.LOG_FILE),
                    maxsize: 10 * 1024 * 1024,
                    maxFiles: 5
                })
            );
        }

        const logger = winston.createLogger({
            level: ENV.LOG_LEVEL,
            format: isDev ? devFormat : prodFormat,
            transports
        });

        logger.info(`Logger initialized (${ENV.NODE_ENV}) → ${isDev ? "console" : "file"}`);
        return logger;
    }

    private patchConsole(): void {
        const lg = this.logger;
        console.log = (...args: any[]) => lg.info(args.join(" "));
        console.info = (...args: any[]) => lg.info(args.join(" "));
        console.warn = (...args: any[]) => lg.warn(args.join(" "));
        console.error = (...args: any[]) => lg.error(args.join(" "));
        console.debug = (...args: any[]) => lg.debug(args.join(" "));
    }

    public info(message: string, ...meta: any[]): void {
        this.logger.info(message, ...meta);
    }

    public error(message: string, ...meta: any[]): void {
        this.logger.error(message, ...meta);
    }

    public warn(message: string, ...meta: any[]): void {
        this.logger.warn(message, ...meta);
    }

    public debug(message: string, ...meta: any[]): void {
        this.logger.debug(message, ...meta);
    }
}

// Export the singleton instance
export const logger = Logger.getInstance().getLogger();
