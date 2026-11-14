const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

const { findProjects, findProjectById } = require('../lib/cloudStore');

async function main() {
  const proj = await findProjectById('cm6408f48c5bd97c15596b4fe2', 'admin', true);
  if (!proj) {
    console.log('Project not found');
    return;
  }
  console.log(`Project: ${proj.projectName} | Client: ${proj.clientName}`);
  console.log(`Members count: ${proj.members?.length}`);
  for (const m of (proj.members || [])) {
    console.log(`\n- Tag: ${m.memberTag} | Type: ${m.memberType} | SubType: ${m.subType}`);
    console.log(`  DimensionsJson:`, typeof m.dimensionsJson === 'string' ? m.dimensionsJson : JSON.stringify(m.dimensionsJson));
    console.log(`  Rebar count: ${m.rebarItems?.length}`);
    for (const r of (m.rebarItems || [])) {
      console.log(`    * Mark: ${r.barMark} | Dia: T${r.dia} | Shape: ${r.shapeCode} | Count: ${r.count} | CutLen: ${r.calculatedCutLength}mm | Wt: ${r.totalWeightKg || ((r.unitWeight * r.count * r.calculatedCutLength)/1000).toFixed(2)}kg | Remarks: ${r.remarks || r.description}`);
    }
  }
}

main();
