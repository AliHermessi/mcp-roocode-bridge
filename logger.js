import fs from "fs";
import path from "path";

class Logger {
  constructor(logFilePath) {
    this.logFilePath = logFilePath;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n\n`;

    // Use fs.appendFile to write to the log file asynchronously
    fs.appendFile(this.logFilePath, logEntry, (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      }
    });
  }

  error(message) {
    this.log(message, 'error');
  }

  warn(message) {
    this.log(message, 'warn');
  }

  info(message) {
    this.log(message, 'info');
  }

  debug(message) {
    this.log(message, 'debug');
  }
}

// Create a logger instance and export it

const logFilePath = path.join(process.cwd(), "error-logs.txt");
const logger = new Logger(logFilePath);

export default logger;
