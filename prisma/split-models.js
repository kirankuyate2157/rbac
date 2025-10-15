import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

// __dirname replacement for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, 'schema.prisma');
const outputDir = path.join(__dirname, 'models');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const schema = fs.readFileSync(schemaPath, 'utf-8');
const lines = schema.split('\n');

let currentModel = '';
let modelName = '';
let insideModel = false;

lines.forEach((line) => {
  const trimmed = line.trim();

  // Start of a model
  if (trimmed.startsWith('model ')) {
    insideModel = true;
    modelName = trimmed.split(' ')[1];
    currentModel = line + '\n';
    return;
  }

  // End of model
  if (insideModel && trimmed === '}') {
    currentModel += line + '\n';
    fs.writeFileSync(
      path.join(outputDir, `${modelName.toLowerCase()}.model.prisma`),
      currentModel
    );
    insideModel = false;
    currentModel = '';
    modelName = '';
    return;
  }

  if (insideModel) {
    currentModel += line + '\n';
  }
});

// Optional: handle enums
const enumMatches = schema.match(/enum\s+[\s\S]+?\}/g);
if (enumMatches) {
  enumMatches.forEach((enm) => {
    const name = enm.match(/enum\s+(\w+)/)[1];
    fs.writeFileSync(
      path.join(outputDir, `${name.toLowerCase()}.enum.prisma`),
      enm
    );
  });
}

console.log('Schema split into individual model files in `models/` folder.');

// --- Run Prisma format on main schema.prisma ---
exec('npx prisma format', { cwd: __dirname }, (err, stdout, stderr) => {
  if (err) {
    console.error('❌ Prisma format error:', err);
    return;
  }
  if (stderr) console.error(stderr);
  console.log('✅ Prisma schema formatted successfully.');
});