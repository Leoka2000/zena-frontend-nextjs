// server/timestampService.ts
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "timestamp.json");

export function saveTimestamp(timestamp: number) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({ lastUpdateTimestamp: timestamp }));
}

export function getTimestamp(): number | null {
  if (!fs.existsSync(filePath)) return null;
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.lastUpdateTimestamp ?? null;
}
