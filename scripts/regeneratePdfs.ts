import fs from 'fs';
import path from 'path';

// 1. Load environment variables
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

import { findProjectById } from '../lib/cloudStore';
import { generateTechnicalBbsPdf } from '../lib/export/technicalBbsPdfExport';

async function main() {
  console.log('--- Regenerating A4 & A3 Technical BBS PDFs ---');
  const proj = await findProjectById('cm91687c95f705d70f697ce5fe', 'admin', true);
  if (!proj) {
    console.error('Project not found');
    return;
  }

  const allRebarItems: any[] = [];
  for (const m of proj.members) {
    allRebarItems.push(...(m.rebarItems || []));
  }

  console.log(`Loaded project: ${proj.projectName} with ${proj.members.length} members and ${allRebarItems.length} bars`);

  const pdfOptions = {
    projectName: proj.projectName,
    clientName: proj.clientName || 'Maharashtra Public Works Department',
    contractorName: proj.contractorName || 'Creative Associate LLP',
    technicalAgency: proj.technicalAgency || 'Creative Structural Consultants',
    rccGrade: proj.rccGrade || 'M30',
    steelGrade: (proj as any).steelGrade || 'Fe500D',
    mbNumber: 'MB-2026/PWD-EX-001',
    notes: 'Verified strictly per IS 2502:1963 Table II, IS 456:2000 Cl. 34 & Cl. 26, IS 13920:2016 ductile detailing.',
    members: proj.members,
  };

  // Generate A4
  const a4Doc = generateTechnicalBbsPdf(allRebarItems, {
    ...pdfOptions,
    pageSize: 'A4',
    orientation: 'portrait',
  });
  const a4Buf = Buffer.from(a4Doc.output('arraybuffer'));
  const a4Path = path.resolve(__dirname, '../artifacts/MNC_Master_BBS_A4_Report.pdf');
  fs.writeFileSync(a4Path, a4Buf);
  console.log(`✓ Generated A4: ${a4Path} (${(a4Buf.length / 1024).toFixed(1)} KB, ${a4Doc.getNumberOfPages()} pages)`);

  // Generate A3
  const a3Doc = generateTechnicalBbsPdf(allRebarItems, {
    ...pdfOptions,
    pageSize: 'A3',
    orientation: 'landscape',
  });
  const a3Buf = Buffer.from(a3Doc.output('arraybuffer'));
  const a3Path = path.resolve(__dirname, '../artifacts/MNC_Master_BBS_A3_Report.pdf');
  fs.writeFileSync(a3Path, a3Buf);
  console.log(`✓ Generated A3: ${a3Path} (${(a3Buf.length / 1024).toFixed(1)} KB, ${a3Doc.getNumberOfPages()} pages)`);
}

main().catch(console.error);
