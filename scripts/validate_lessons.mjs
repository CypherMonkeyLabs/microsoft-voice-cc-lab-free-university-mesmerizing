// Validates data/lesson-map.json against campus/data/tracks.
// Every lesson needs a level 0-10, at least one outcome, source ids that exist, and a matching title.
// Run: node scripts/validate_lessons.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const map = JSON.parse(readFileSync(join(root, "data/lesson-map.json"), "utf8"));
const schema = JSON.parse(readFileSync(join(root, "data/lesson-schema.json"), "utf8"));
const sources = JSON.parse(readFileSync(join(root, "data/sources.json"), "utf8"));
const sourceIds = new Set(sources.sources.map((source) => source.id));
const required = schema.required;
const problems = [];
const catalog = new Map();

for (const name of readdirSync(join(root, "campus/data/tracks")).filter((file) => /^t\d+\.json$/.test(file)).sort()) {
  const track = JSON.parse(readFileSync(join(root, "campus/data/tracks", name), "utf8"));
  for (const lesson of track.lessons) catalog.set(`${track.id}/${lesson.id}`, lesson);
}

const mapped = new Map(map.lessons.map((lesson) => [lesson.key, lesson]));
for (const [key, lesson] of catalog) {
  const row = mapped.get(key);
  if (!row) {
    problems.push(`${key}: not in lesson-map.json`);
    continue;
  }
  for (const field of required) if (!(field in row)) problems.push(`${key}: missing field ${field}`);
  if (!Number.isInteger(row.level) || row.level < schema.level_min || row.level > schema.level_max) {
    problems.push(`${key}: level must be ${schema.level_min}-${schema.level_max}`);
  }
  if (!Array.isArray(row.outcomes) || row.outcomes.length < 1 || row.outcomes.some((item) => typeof item !== "string" || item.length < 8)) {
    problems.push(`${key}: needs at least one outcome`);
  }
  if (!Array.isArray(row.sources) || row.sources.length < 1) problems.push(`${key}: needs at least one source`);
  for (const source of row.sources || []) if (!sourceIds.has(source)) problems.push(`${key}: unknown source id ${source}`);
  if (row.title !== lesson.title) problems.push(`${key}: title differs from the lesson file`);
  if (row.last_verified !== null && !/^\d{4}-\d{2}-\d{2}$/.test(row.last_verified)) {
    problems.push(`${key}: last_verified must be null or YYYY-MM-DD`);
  }
}
for (const key of mapped.keys()) if (!catalog.has(key)) problems.push(`${key}: in lesson-map.json but no such lesson`);

const perLevel = {};
for (const row of map.lessons) perLevel[row.level] = (perLevel[row.level] || 0) + 1;
for (const problem of problems) console.log("FAIL", problem);
console.log("lessons:", catalog.size, "mapped:", mapped.size, "per level:", JSON.stringify(perLevel));
console.log("validate_lessons:", problems.length, "problems");
process.exit(problems.length ? 1 : 0);
