// UgoTour backend bootstrap.
// Node does not automatically read .env files, so this tiny zero-dependency
// loader makes local development predictable while still allowing hosting
// platforms to inject real environment variables in production.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equals = line.indexOf("=");
    if (equals < 1) continue;
    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Environment variables supplied by the OS/hosting platform always win.
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), "../.env"));

await import("./src/server.js");
