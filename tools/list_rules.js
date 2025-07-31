import fs from "fs/promises";
import path from "path";
import os from "os";
import logger from "../logger.js";

const errorLogPath = path.join(process.cwd(), "error-logs.txt");

async function recursiveListRules(baseScope, baseDir, result) {
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(baseDir, entry.name);
      if (entry.isDirectory()) {
        await recursiveListRules(
          `${baseScope}/${entry.name}`,
          fullPath,
          result
        );
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if ([".json", ".txt", ".md"].includes(ext)) {
          try {
            const content = await fs.readFile(fullPath, "utf8");
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              for (const rule of parsed) {
                result.push({
                  ...rule,
                  scope: baseScope,
                  file: entry.name,
                  path: fullPath,
                });
              }
            } else {
              result.push({
                ...parsed,
                scope: baseScope,
                file: entry.name,
                path: fullPath,
              });
            }

          } catch (err) {
            const logMessage = `[list_rules]: Failed to parse ${fullPath}: ${err.message}\n`;
            console.error(logMessage);
            await fs.appendFile(errorLogPath, logMessage);
          }
        }
      }
    }
  } catch (e) {
    if (e.code !== "ENOENT") {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}][list_rules]: Error reading ${baseDir} - ${e.message}\n`;
      console.error(logMessage);
      await fs.appendFile(errorLogPath, logMessage);
    }
  }
}

async function listRules() {
  const timestamp = new Date().toISOString();
  const result = [];

  const projectDir = process.cwd();
  const globalDir = path.join(os.homedir(), ".roo");
  const projectRooDir = path.join(projectDir, ".roo");

  const sources = [
    { name: "global", dir: path.join(globalDir, "rules") },
    { name: "workspace", dir: path.join(projectRooDir, "rules") },
  ];

  try {
    const modesPath = path.join(projectRooDir, "custom_modes.json");
    const modesData = await fs.readFile(modesPath, "utf8");
    const modes = Object.keys(JSON.parse(modesData));

    for (const mode of modes) {
      sources.push({
        name: `mode:${mode}`,
        dir: path.join(projectRooDir, `rules-${mode}`),
      });
      sources.push({
        name: `global-mode:${mode}`,
        dir: path.join(globalDir, `rules-${mode}`),
      });
    }
  } catch (e) {
    if (e.code !== "ENOENT") {
      const logMessage = `[${timestamp}][list_rules]: Error reading custom_modes.json - ${e.message}\n`;
      console.error(logMessage);
      await fs.appendFile(errorLogPath, logMessage);
    }
  }

// Removed legacy files logic

  for (const src of sources) {
    await recursiveListRules(src.name, src.dir, result);
  }

// Removed legacy file processing

  return JSON.stringify(result); // 👈 or just return result if you don’t want it as a string
}

export default listRules;
