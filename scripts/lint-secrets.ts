import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const forbiddenTracked = new Set([".env", ".env.local", ".env.production"]);
const sensitiveAssignment =
  /(?:PRIVATE_KEY|MNEMONIC|BEARER_TOKEN|API_KEY|ADMIN_TOKEN|ENCRYPTION_KEY|SECRET)\s*=\s*["']?[^"'\n]+["']?/i;
const publicExposurePattern = /NEXT_PUBLIC_[A-Z0-9_]*(?:PRIVATE|TOKEN|SECRET|MNEMONIC|ENCRYPTION|KEY)[A-Z0-9_]*/;

const failures: string[] = [];

for (const file of tracked) {
  if (forbiddenTracked.has(file)) {
    failures.push(`${file} is tracked but must stay local`);
    continue;
  }

  if (/\.(png|jpg|jpeg|gif|webp|pdf|ico)$/i.test(file)) {
    continue;
  }

  const contents = readFileSync(file, "utf8");
  if (publicExposurePattern.test(contents)) {
    failures.push(`${file} references a sensitive NEXT_PUBLIC_* name`);
  }

  if (file !== ".env.example" && sensitiveAssignment.test(contents)) {
    failures.push(`${file} appears to contain a non-empty sensitive assignment`);
  }

  if (file === ".env.example") {
    const unsafeExampleLines = contents
      .split("\n")
      .filter((line) => sensitiveAssignment.test(line) && !line.trim().endsWith('=""'));
    for (const line of unsafeExampleLines) {
      failures.push(`.env.example must keep sensitive placeholders empty: ${line.split("=")[0]}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`secret lint passed (${tracked.length} tracked files scanned)`);
