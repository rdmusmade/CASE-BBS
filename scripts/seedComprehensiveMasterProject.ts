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

import { createProject, addMemberToProject } from '../lib/cloudStore';
import { prisma } from '../lib/prisma';
import { generateFootingBBS } from '../lib/engine/members/footing';
import { generateBeamBBS } from '../lib/engine/members/beam';
import { generateColumnBBS } from '../lib/engine/members/column';
import { generateSlabBBS } from '../lib/engine/members/slab';
import { generateRccPardiBBS } from '../lib/engine/members/rccPardi';
import { generatePlainPccMeshBBS } from '../lib/engine/members/plainPccMesh';
import { generateStaircaseBBS } from '../lib/engine/members/staircase';
import { generateWaterTankBBS } from '../lib/engine/members/waterTank';
import { generateTechnicalBbsPdf } from '../lib/export/technicalBbsPdfExport';

async function main() {
  console.log('--- Seeding Comprehensive MNC Master BBS Project ---');

  const userId = 'admin'; // Or user cmw90khi20000l2c1k5g3euvv / admin
  const projectData = {
    userId,
    projectName: 'Creative Associates — MNC Master BBS Golden Master (IS 2502 & IS 13920 Full Suite)',
    clientName: 'Maharashtra Public Works Department (Executive Engineer)',
    contractorName: 'Creative Associate LLP & Infrastructure Contractors',
    technicalAgency: 'Creative Structural Engineering Consultants & BIS Quality Audit Cell',
    authorityStandard: 'MAHARASHTRA_PWD',
    siteLocation: 'Rahuri - Ahmednagar Regional Infrastructure Project (Package-04)',
    rccGrade: 'M30',
    rebarGrade: 'Fe500D',
    notes: 'Strict compliance with IS 2502:1963, IS 456:2000 Cl. 34/26, IS 13920:2016 ductile seismic detailing, IS 3370:2021 water retaining structures & SP 34 handbook.',
    user: {
      name: 'Creative Associate LLP',
      email: 'admin',
      companyName: 'Creative Associate LLP',
      phone: '+91 8484 86 6868',
    },
  };

  const project = await createProject(projectData);
  console.log(`✓ Project created in Firestore: [${project.id}] ${project.projectName}`);

  // Dual-sync to local Prisma
  try {
    await prisma.project.create({
      data: {
        id: project.id,
        userId: 'cmw90khi20000l2c1k5g3euvv',
        projectName: project.projectName,
        clientName: project.clientName,
        contractorName: project.contractorName,
        technicalAgency: project.technicalAgency,
        authorityStandard: project.authorityStandard,
        siteLocation: project.siteLocation,
        rccGrade: project.rccGrade,
        rebarGrade: project.rebarGrade,
        notes: project.notes,
      },
    });
    console.log(`✓ Project mirrored to Prisma SQLite.`);
  } catch (err: any) {
    console.warn('Prisma project mirror notice:', err.message);
  }

  // Define All 19 Members
  const memberSpecs = [
    // 1. Isolated Footing
    {
      memberTag: 'FTG-01',
      memberType: 'FOOTING',
      subType: 'ISOLATED',
      input: {
        memberTag: 'FTG-01',
        footingType: 'ISOLATED',
        length: 1800,
        width: 1800,
        depth: 450,
        clearCover: 50,
        bottomDiaX: 12,
        bottomSpacingX: 150,
        bottomDiaY: 12,
        bottomSpacingY: 150,
        hasTopMesh: false,
        includeChairs: false,
      },
      getItems: (inp: any) => generateFootingBBS(inp),
    },

    // 2. Sloped / Trapezoidal Footing with d_edge >= 150mm (min 150 per IS 456 Cl. 34.1.2) - no top mesh
    {
      memberTag: 'FTG-02',
      memberType: 'FOOTING',
      subType: 'SLOPED_TRAPEZOIDAL',
      input: {
        memberTag: 'FTG-02',
        footingType: 'SLOPED_TRAPEZOIDAL',
        length: 2100,
        width: 2100,
        depth: 600,
        edgeDepth: 200, // d_edge >= 150mm
        clearCover: 50,
        bottomDiaX: 16,
        bottomSpacingX: 125,
        bottomDiaY: 16,
        bottomSpacingY: 125,
        hasTopMesh: false,
        includeChairs: false,
      },
      getItems: (inp: any) => generateFootingBBS(inp),
    },

    // 3. Stepped Footing
    {
      memberTag: 'FTG-03',
      memberType: 'FOOTING',
      subType: 'STEPPED',
      input: {
        memberTag: 'FTG-03',
        footingType: 'STEPPED',
        length: 2400,
        width: 2400,
        depth: 350,
        stepLength2: 1500,
        stepWidth2: 1500,
        stepDepth1: 350,
        stepDepth2: 250,
        clearCover: 50,
        bottomDiaX: 16,
        bottomSpacingX: 125,
        bottomDiaY: 16,
        bottomSpacingY: 125,
      },
      getItems: (inp: any) => generateFootingBBS(inp),
    },

    // 4. Strap Footing (Footing 1 + Footing 2 + Connecting Strap Beam)
    {
      memberTag: 'FTG-04',
      memberType: 'FOOTING',
      subType: 'STRAP',
      input: {
        memberTag: 'FTG-04',
        footingType: 'STRAP',
        length: 1800,
        width: 1800,
        depth: 500,
        clearCover: 50,
        f1Length: 1800,
        f1Width: 1800,
        f1Depth: 500,
        f1DiaX: 12,
        f1SpacingX: 150,
        f1DiaY: 12,
        f1SpacingY: 150,
        f2Length: 2400,
        f2Width: 2400,
        f2Depth: 600,
        f2DiaX: 16,
        f2SpacingX: 150,
        f2DiaY: 16,
        f2SpacingY: 150,
        strapBeamLength: 4000,
        strapBeamWidth: 400,
        strapBeamDepth: 750,
        strapTopDia: 25,
        strapTopCount: 4,
        strapBottomDia: 20,
        strapBottomCount: 3,
        strapStirrupDia: 8,
        strapStirrupSpacing: 150,
      },
      getItems: (inp: any) => generateFootingBBS(inp),
    },

    // 5. Combined Footing with 2 Columns
    {
      memberTag: 'FTG-05',
      memberType: 'FOOTING',
      subType: 'COMBINED',
      input: {
        memberTag: 'FTG-05',
        footingType: 'COMBINED',
        length: 5600,
        width: 2200,
        depth: 750,
        clearCover: 50,
        colSpacing: 3500,
        col1WidthX: 450,
        col1WidthY: 450,
        col2WidthX: 500,
        col2WidthY: 500,
        bottomDiaX: 20,
        bottomSpacingX: 125,
        bottomDiaY: 16,
        bottomSpacingY: 150,
        hasTopMesh: true,
        topDiaX: 16,
        topSpacingX: 150,
        topDiaY: 12,
        topSpacingY: 150,
        includeChairs: true,
        chairDia: 16,
      },
      getItems: (inp: any) => generateFootingBBS(inp),
    },

    // 6. Raft Foundation with 3D Spacer Chairs
    {
      memberTag: 'FTG-06',
      memberType: 'FOOTING',
      subType: 'RAFT',
      input: {
        memberTag: 'FTG-06',
        footingType: 'RAFT',
        length: 10000,
        width: 8000,
        depth: 900,
        clearCover: 50,
        bottomDiaX: 20,
        bottomSpacingX: 150,
        bottomDiaY: 20,
        bottomSpacingY: 150,
        hasTopMesh: true,
        topDiaX: 16,
        topSpacingX: 150,
        topDiaY: 16,
        topSpacingY: 150,
        includeChairs: true,
        chairDia: 16,
        chairSpacing: 1000,
      },
      getItems: (inp: any) => generateFootingBBS(inp),
    },

    // 7. Pile Foundation (Pile Cap with 4 Circular Piles)
    {
      memberTag: 'FTG-07',
      memberType: 'FOOTING',
      subType: 'PILE_CAP',
      input: {
        memberTag: 'FTG-07',
        footingType: 'PILE_CAP',
        pileCapShape: 'SQUARE',
        pileCapLength: 3000,
        pileCapWidth: 3000,
        pileCapDepth: 1000,
        clearCover: 60,
        pileCount: 4,
        pileShape: 'CIRCULAR',
        pileDia: 600,
        pileLength: 15000,
        pileVerticalDia: 25,
        pileVerticalCount: 8,
        pileSpiralDia: 10,
        pileSpiralPitch: 100,
        bottomDiaX: 25,
        bottomSpacingX: 125,
        bottomDiaY: 25,
        bottomSpacingY: 125,
        length: 3000,
        width: 3000,
        depth: 1000,
      },
      getItems: (inp: any) => generateFootingBBS(inp),
    },

    // 8. Simply Supported Beam with Confinement Zones
    {
      memberTag: 'BM-01',
      memberType: 'BEAM',
      subType: 'SIMPLY_SUPPORTED',
      input: {
        memberTag: 'BM-01',
        beamType: 'SIMPLY_SUPPORTED',
        clearSpan: 5000,
        width: 300,
        depth: 600,
        supportWidthLeft: 350,
        supportWidthRight: 350,
        clearCover: 25,
        topMainDia: 16,
        topMainCount: 2,
        topMainDia2: 12,
        topMainCount2: 2,
        bottomMainDia: 25,
        bottomMainCount: 3,
        bottomMainDia2: 20,
        bottomMainCount2: 2,
        hasCrankedBars: true,
        crankedBarDia: 20,
        crankedBarCount: 2,
        topExtraLeftDia: 20,
        topExtraLeftCount: 2,
        topExtraRightDia: 20,
        topExtraRightCount: 2,
        stirrupDia: 8,
        stirrupSpacingSupport: 100,
        stirrupSpacingMid: 175,
        stirrupType: '2_LEG',
      },
      getItems: (inp: any) => generateBeamBBS(inp),
    },

    // 9. Cantilever Beam with Ld anchorage and downward bend at tip
    {
      memberTag: 'BM-02',
      memberType: 'BEAM',
      subType: 'CANTILEVER',
      input: {
        memberTag: 'BM-02',
        beamType: 'CANTILEVER',
        clearSpan: 2200,
        width: 300,
        depth: 550,
        supportWidthLeft: 400,
        clearCover: 25,
        topMainDia: 25,
        topMainCount: 4,
        bottomMainDia: 16,
        bottomMainCount: 2,
        stirrupDia: 8,
        stirrupSpacingSupport: 100,
        stirrupSpacingMid: 125,
        stirrupType: '2_LEG',
      },
      getItems: (inp: any) => generateBeamBBS(inp),
    },

    // 10. Continuous Multi-Span Beam
    {
      memberTag: 'BM-03',
      memberType: 'BEAM',
      subType: 'CONTINUOUS',
      input: {
        memberTag: 'BM-03',
        beamType: 'CONTINUOUS',
        clearSpan: 6000,
        span2Length: 5500,
        intermediateSupportWidth: 400,
        width: 350,
        depth: 650,
        clearCover: 25,
        topMainDia: 20,
        topMainCount: 2,
        bottomMainDia: 25,
        bottomMainCount: 4,
        topExtraMidSupportDia: 25,
        topExtraMidSupportCount: 3,
        stirrupDia: 10,
        stirrupSpacingSupport: 100,
        stirrupSpacingMid: 200,
        stirrupType: '2_LEG',
      },
      getItems: (inp: any) => generateBeamBBS(inp),
    },

    // 11. Column with mixed Corner & Face bars and Master + Diamond ties
    {
      memberTag: 'COL-01',
      memberType: 'COLUMN',
      subType: 'RECTANGULAR',
      input: {
        memberTag: 'COL-01',
        columnShape: 'RECTANGULAR',
        width: 400,
        depth: 600,
        clearHeight: 3300,
        clearCover: 40,
        cornerDia: 25,
        cornerCount: 4,
        sideDia: 20,
        sideCount: 4,
        tieDia: 8,
        tieSpacingConfined: 100,
        tieSpacingNormal: 150,
        tieType: 'RECT_PLUS_DIAMOND',
        isStarterBar: true,
        footingLAnchor: 400,
      },
      getItems: (inp: any) => generateColumnBBS(inp),
    },

    // 12. Circular Column with Helical Spiral
    {
      memberTag: 'COL-02',
      memberType: 'COLUMN',
      subType: 'CIRCULAR',
      input: {
        memberTag: 'COL-02',
        columnShape: 'CIRCULAR',
        width: 500,
        clearHeight: 3300,
        clearCover: 40,
        mainBarDia: 20,
        mainBarCount: 8,
        tieDia: 8,
        tieType: 'HELICAL_SPIRAL',
        spiralPitch: 75,
        isStarterBar: true,
        footingLAnchor: 350,
      },
      getItems: (inp: any) => generateColumnBBS(inp),
    },

    // 13. One-Way Slab
    {
      memberTag: 'SLB-01',
      memberType: 'SLAB',
      subType: 'ONE_WAY',
      input: {
        memberTag: 'SLB-01',
        slabType: 'ONE_WAY',
        shortSpanLx: 2500,
        longSpanLy: 7000,
        thickness: 125,
        clearCover: 20,
        shortMainDia: 10,
        shortMainSpacing: 125,
        longMainDia: 8,
        longMainSpacing: 175,
        hasTopExtraAtSupports: true,
      },
      getItems: (inp: any) => generateSlabBBS(inp),
    },

    // 14. Two-Way Restrained Slab
    {
      memberTag: 'SLB-02',
      memberType: 'SLAB',
      subType: 'TWO_WAY',
      input: {
        memberTag: 'SLB-02',
        slabType: 'TWO_WAY',
        shortSpanLx: 3800,
        longSpanLy: 4800,
        thickness: 150,
        clearCover: 20,
        shortMainDia: 10,
        shortMainSpacing: 150,
        longMainDia: 10,
        longMainSpacing: 150,
        useAlternateCrank: true,
        hasTopExtraAtSupports: true,
      },
      getItems: (inp: any) => generateSlabBBS(inp),
    },

    // 15. Double Jali Slab with 3D Spacer Chairs
    {
      memberTag: 'SLB-03',
      memberType: 'SLAB',
      subType: 'DOUBLE_JALI',
      input: {
        memberTag: 'SLB-03',
        slabType: 'DOUBLE_JALI',
        shortSpanLx: 4500,
        longSpanLy: 6000,
        thickness: 200,
        clearCover: 25,
        shortMainDia: 12,
        shortMainSpacing: 150,
        longMainDia: 12,
        longMainSpacing: 150,
        topMeshDiaX: 10,
        topMeshSpacingX: 150,
        topMeshDiaY: 10,
        topMeshSpacingY: 150,
        includeChairs: true,
        chairDia: 12,
      },
      getItems: (inp: any) => generateSlabBBS(inp),
    },

    // 16. Plain PCC Ground Slab with Single Jali
    {
      memberTag: 'PCC-01',
      memberType: 'PLAIN_PCC_MESH',
      subType: 'PLAIN_PCC_WITH_MESH',
      input: {
        memberTag: 'PCC-01',
        flooringType: 'PLAIN_PCC_WITH_MESH',
        length: 8000,
        width: 6000,
        thickness: 100,
        clearCover: 30,
        meshDiaX: 8,
        meshSpacingX: 150,
        meshDiaY: 8,
        meshSpacingY: 150,
        hasEdgeBendUp: true,
      },
      getItems: (inp: any) => generatePlainPccMeshBBS(inp),
    },

    // 17. RCC Pardi / Shear Wall
    {
      memberTag: 'SW-01',
      memberType: 'RCC_PARDI',
      subType: 'RCC_PARDI',
      input: {
        memberTag: 'SW-01',
        wallType: 'RCC_PARDI',
        length: 4000,
        height: 3300,
        thickness: 230,
        clearCover: 30,
        vertMainDia: 12,
        vertMainSpacing: 150,
        horizDistDia: 10,
        horizDistSpacing: 150,
        includeEndCaps: true,
        includeCrossTies: true,
      },
      getItems: (inp: any) => generateRccPardiBBS(inp),
    },

    // 18. Staircase Waist Slab with SP:34 Cross-over
    {
      memberTag: 'STR-01',
      memberType: 'STAIRCASE',
      subType: 'DOGLEGGED',
      input: {
        memberTag: 'STR-01',
        staircaseType: 'DOGLEGGED',
        flightWidth: 1200,
        waistThickness: 150,
        tread: 275,
        riser: 150,
        numberOfSteps: 11,
        landing1Length: 1200,
        landing2Length: 1200,
        clearCover: 20,
        mainBarDia: 12,
        mainBarSpacing: 125,
        distBarDia: 8,
        distBarSpacing: 150,
      },
      getItems: (inp: any) => generateStaircaseBBS(inp),
    },

    // 19. Water Tank Retaining Wall (IS 3370)
    {
      memberTag: 'WT-01',
      memberType: 'WATER_TANK',
      subType: 'UNDERGROUND_WATER_TANK',
      input: {
        memberTag: 'WT-01',
        structureType: 'UNDERGROUND_WATER_TANK',
        wallLength: 6000,
        wallHeight: 3500,
        wallThickness: 300,
        liquidFaceCover: 40,
        outerFaceCover: 30,
        verticalDiaWaterFace: 16,
        verticalSpacingWaterFace: 125,
        verticalDiaOuterFace: 12,
        verticalSpacingOuterFace: 150,
        horizontalDiaWaterFace: 12,
        horizontalSpacingWaterFace: 150,
        horizontalDiaOuterFace: 10,
        horizontalSpacingOuterFace: 150,
      },
      getItems: (inp: any) => generateWaterTankBBS(inp),
    },
  ];

  const allRebarItems: any[] = [];
  const populatedMembers: any[] = [];

  for (const spec of memberSpecs) {
    const rebars = spec.getItems(spec.input);
    allRebarItems.push(...rebars);

    const savedMember = await addMemberToProject(
      project.id,
      {
        memberTag: spec.memberTag,
        memberType: spec.memberType,
        subType: spec.subType,
        dimensionsJson: spec.input,
        rebarItems: rebars,
        clearCover: spec.input.clearCover || 40,
        concreteGrade: 'M30',
        steelGrade: 'Fe500D',
      },
      userId,
      true
    );

    populatedMembers.push(savedMember);
    console.log(`  + Seeded Member [${spec.memberTag}] ${spec.memberType} (${spec.subType}) -> ${rebars.length} bars`);

    // Dual-sync member to Prisma SQLite
    try {
      await prisma.member.create({
        data: {
          id: savedMember.id,
          projectId: project.id,
          memberTag: spec.memberTag,
          memberType: spec.memberType,
          subType: spec.subType,
          dimensionsJson: JSON.stringify(spec.input),
          clearCover: spec.input.clearCover || 40,
          concreteGrade: 'M30',
          steelGrade: 'Fe500D',
          rebarItems: {
            create: rebars.map((r: any) => ({
              barMark: r.barMark,
              shapeCode: r.shapeCode || '20',
              dia: r.dia,
              count: r.count,
              dimA: r.dimA || 0,
              dimB: r.dimB || 0,
              dimC: r.dimC || 0,
              dimD: r.dimD || 0,
              dimE: r.dimE || 0,
              calculatedCutLength: r.calculatedCutLength,
              unitWeight: r.unitWeight,
              isPayable: r.isPayable !== false,
              isChair: Boolean(r.isChair),
              isLap: Boolean(r.isLap),
              remarks: r.remarks || r.description || '',
            })),
          },
        },
      });
    } catch (err: any) {
      console.warn(`Prisma member mirror notice for ${spec.memberTag}:`, err.message);
    }
  }

  console.log(`\n✓ All 19 Members successfully seeded into project [${project.id}]!`);
  console.log(`Total Rebar Line Items across project: ${allRebarItems.length}`);

  // Generate Technical PDF Reports (A4 & A3)
  console.log('\n--- Generating Golden Master A4 and A3 Technical BBS PDF Reports ---');
  const pdfOptions = {
    pageSize: 'A4' as const,
    orientation: 'portrait' as const,
    projectName: project.projectName,
    clientName: project.clientName || 'Maharashtra Public Works Department',
    contractorName: project.contractorName || 'Creative Associate LLP',
    technicalAgency: project.technicalAgency || 'Creative Structural Consultants',
    rccGrade: project.rccGrade || 'M30',
    steelGrade: (project as any).steelGrade || 'Fe500D',
    mbNumber: 'MB-2026/PWD-EX-001',
    notes: 'Verified strictly per IS 2502:1963 Table II, IS 456:2000 Cl. 34 & Cl. 26, IS 13920:2016 ductile detailing.',
    members: populatedMembers,
  };

  const a4Doc = generateTechnicalBbsPdf(allRebarItems, pdfOptions);
  const a4Buffer = Buffer.from(a4Doc.output('arraybuffer'));
  const a4Path = path.resolve(__dirname, '../artifacts/MNC_Master_BBS_A4_Report.pdf');
  fs.mkdirSync(path.dirname(a4Path), { recursive: true });
  fs.writeFileSync(a4Path, a4Buffer);
  console.log(`✓ A4 Technical BBS PDF written: ${a4Path} (${(a4Buffer.length / 1024).toFixed(1)} KB, ${a4Doc.getNumberOfPages()} pages)`);

  const a3Doc = generateTechnicalBbsPdf(allRebarItems, {
    ...pdfOptions,
    pageSize: 'A3',
    orientation: 'landscape',
  });
  const a3Buffer = Buffer.from(a3Doc.output('arraybuffer'));
  const a3Path = path.resolve(__dirname, '../artifacts/MNC_Master_BBS_A3_Report.pdf');
  fs.writeFileSync(a3Path, a3Buffer);
  console.log(`✓ A3 Technical BBS PDF written: ${a3Path} (${(a3Buffer.length / 1024).toFixed(1)} KB, ${a3Doc.getNumberOfPages()} pages)`);
}

main()
  .catch((e) => {
    console.error('Fatal error in seeding:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
