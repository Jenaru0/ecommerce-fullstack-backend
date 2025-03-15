// filepath: c:\Users\jonna\OneDrive\Escritorio\ecommerce-fullstack\backend\src\utils\logger.ts
import winston from "winston";
import path from "path";

// Configuración de niveles
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determinar nivel según entorno
const level = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "development" ? "debug" : "info";
};

// Formato personalizado
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), "logs");

// Configurar transportes
const transports = [
  // Consola para desarrollo
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
        }`;
      })
    ),
  }),
  // Archivo para errores
  new winston.transports.File({
    filename: path.join(logsDir, "error.log"),
    level: "error",
  }),
  // Archivo para todos los logs
  new winston.transports.File({
    filename: path.join(logsDir, "combined.log"),
  }),
];

// Crear y exportar logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Añadir un stream para integrarse con morgan
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
