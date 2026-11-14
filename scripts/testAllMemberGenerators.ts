import { generateFootingBBS } from '../lib/engine/members/footing';
import { generateBeamBBS } from '../lib/engine/members/beam';
import { generateColumnBBS } from '../lib/engine/members/column';
import { generateSlabBBS } from '../lib/engine/members/slab';
import { generateRccPardiBBS } from '../lib/engine/members/rccPardi';
import { generatePlainPccMeshBBS } from '../lib/engine/members/plainPccMesh';
import { generateStaircaseBBS } from '../lib/engine/members/staircase';
import { generateWaterTankBBS } from '../lib/engine/members/waterTank';

console.log('--- Testing Member BBS Generators ---');

try {
  // 1. Isolated Footing
  const f1 = generateFootingBBS({
    memberTag: 'FTG-01',
    footingType: 'ISOLATED',
    length: 1500,
    width: 1500,
    depth: 450,
    bottomDiaX: 12,
    bottomSpacingX: 150,
    bottomDiaY: 12,
    bottomSpacingY: 150,
    hasTopMesh: false,
    includeChairs: false,
  });
  console.log(`✓ FTG-01: ${f1.length} items`);

  // 2. Trapezoidal Footing
  const f2 = generateFootingBBS({
    memberTag: 'FTG-02',
    footingType: 'SLOPED_TRAPEZOIDAL',
    length: 1800,
    width: 1800,
    depth: 550,
    edgeDepth: 200,
    bottomDiaX: 16,
    bottomSpacingX: 125,
    bottomDiaY: 16,
    bottomSpacingY: 125,
    hasTopMesh: false,
    includeChairs: false,
  });
  console.log(`✓ FTG-02 (Trapezoidal): ${f2.length} items`);

  // 3. Stepped Footing
  const f3 = generateFootingBBS({
    memberTag: 'FTG-03',
    footingType: 'STEPPED',
    length: 2000,
    width: 2000,
    depth: 300,
    stepLength2: 1400,
    stepWidth2: 1400,
    stepDepth1: 300,
    stepDepth2: 250,
    bottomDiaX: 12,
    bottomSpacingX: 150,
    bottomDiaY: 12,
    bottomSpacingY: 150,
  });
  console.log(`✓ FTG-03 (Stepped): ${f3.length} items`);

  // 4. Strap Footing
  const f4 = generateFootingBBS({
    memberTag: 'FTG-04',
    footingType: 'STRAP',
    f1Length: 1600,
    f1Width: 1600,
    f1Depth: 450,
    f1DiaX: 12,
    f1SpacingX: 150,
    f1DiaY: 12,
    f1SpacingY: 150,
    f2Length: 2200,
    f2Width: 2200,
    f2Depth: 550,
    f2DiaX: 16,
    f2SpacingX: 150,
    f2DiaY: 16,
    f2SpacingY: 150,
    strapBeamLength: 3500,
    strapBeamWidth: 350,
    strapBeamDepth: 600,
    strapTopDia: 20,
    strapTopCount: 4,
    strapBottomDia: 16,
    strapBottomCount: 3,
    strapStirrupDia: 8,
    strapStirrupSpacing: 150,
    length: 1600,
    width: 1600,
    depth: 450,
  });
  console.log(`✓ FTG-04 (Strap): ${f4.length} items`);

  // 5. Combined Footing
  const f5 = generateFootingBBS({
    memberTag: 'FTG-05',
    footingType: 'COMBINED',
    length: 5000,
    width: 2000,
    depth: 650,
    bottomDiaX: 16,
    bottomSpacingX: 125,
    bottomDiaY: 12,
    bottomSpacingY: 150,
    hasTopMesh: true,
    topDiaX: 16,
    topSpacingX: 125,
    topDiaY: 12,
    topSpacingY: 150,
    includeChairs: true,
  });
  console.log(`✓ FTG-05 (Combined): ${f5.length} items`);

  // 6. Raft Foundation
  const f6 = generateFootingBBS({
    memberTag: 'FTG-06',
    footingType: 'RAFT',
    length: 8000,
    width: 6000,
    depth: 750,
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
  });
  console.log(`✓ FTG-06 (Raft): ${f6.length} items`);

  // 7. Pile Foundation
  const f7 = generateFootingBBS({
    memberTag: 'FTG-07',
    footingType: 'PILE_CAP',
    pileCapShape: 'SQUARE',
    pileCapLength: 2500,
    pileCapWidth: 2500,
    pileCapDepth: 900,
    pileCount: 4,
    pileShape: 'CIRCULAR',
    pileDia: 500,
    pileLength: 12000,
    pileVerticalDia: 20,
    pileVerticalCount: 6,
    pileSpiralDia: 8,
    pileSpiralPitch: 100,
    bottomDiaX: 20,
    bottomSpacingX: 125,
    bottomDiaY: 20,
    bottomSpacingY: 125,
    length: 2500,
    width: 2500,
    depth: 900,
  });
  console.log(`✓ FTG-07 (Pile Cap): ${f7.length} items`);

  // 8. Simply Supported Beam
  const b1 = generateBeamBBS({
    memberTag: 'BM-01',
    beamType: 'SIMPLY_SUPPORTED',
    clearSpan: 4500,
    width: 230,
    depth: 450,
    topMainDia: 16,
    topMainCount: 2,
    topMainDia2: 12,
    topMainCount2: 1,
    bottomMainDia: 20,
    bottomMainCount: 2,
    bottomMainDia2: 16,
    bottomMainCount2: 1,
    stirrupDia: 8,
    stirrupSpacingSupport: 100,
    stirrupSpacingMid: 150,
    hasCrankedBars: true,
    crankedBarDia: 16,
    crankedBarCount: 2,
  });
  console.log(`✓ BM-01 (Simply Supported): ${b1.length} items`);

  // 9. Cantilever Beam
  const b2 = generateBeamBBS({
    memberTag: 'BM-02',
    beamType: 'CANTILEVER',
    clearSpan: 2000,
    width: 230,
    depth: 500,
    topMainDia: 20,
    topMainCount: 3,
    bottomMainDia: 12,
    bottomMainCount: 2,
    stirrupDia: 8,
    stirrupSpacingSupport: 100,
    stirrupSpacingMid: 125,
  });
  console.log(`✓ BM-02 (Cantilever): ${b2.length} items`);

  // 10. Continuous Beam
  const b3 = generateBeamBBS({
    memberTag: 'BM-03',
    beamType: 'CONTINUOUS',
    clearSpan: 5000,
    span2Length: 4500,
    width: 300,
    depth: 600,
    topMainDia: 16,
    topMainCount: 2,
    bottomMainDia: 20,
    bottomMainCount: 3,
    topExtraMidSupportDia: 20,
    topExtraMidSupportCount: 2,
    stirrupDia: 8,
    stirrupSpacingSupport: 100,
    stirrupSpacingMid: 175,
  });
  console.log(`✓ BM-03 (Continuous): ${b3.length} items`);

  // 11. Column with mixed bars
  const c1 = generateColumnBBS({
    memberTag: 'COL-01',
    columnShape: 'RECTANGULAR',
    width: 300,
    depth: 500,
    clearHeight: 3200,
    cornerDia: 20,
    cornerCount: 4,
    sideDia: 16,
    sideCount: 4,
    tieDia: 8,
    tieSpacingConfined: 100,
    tieSpacingNormal: 150,
    tieType: 'RECT_PLUS_DIAMOND',
    isStarterBar: true,
    footingLAnchor: 350,
  });
  console.log(`✓ COL-01 (Rectangular Mixed): ${c1.length} items`);

  // 12. Circular Column
  const c2 = generateColumnBBS({
    memberTag: 'COL-02',
    columnShape: 'CIRCULAR',
    width: 450,
    clearHeight: 3200,
    mainBarDia: 16,
    mainBarCount: 6,
    tieDia: 8,
    tieType: 'HELICAL_SPIRAL',
    spiralPitch: 75,
  });
  console.log(`✓ COL-02 (Circular Spiral): ${c2.length} items`);

  // 13. One-Way Slab
  const s1 = generateSlabBBS({
    memberTag: 'SLB-01',
    slabType: 'ONE_WAY',
    shortSpanLx: 2400,
    longSpanLy: 6000,
    thickness: 125,
    shortMainDia: 10,
    shortMainSpacing: 125,
    longMainDia: 8,
    longMainSpacing: 175,
  });
  console.log(`✓ SLB-01 (One-Way): ${s1.length} items`);

  // 14. Two-Way Slab
  const s2 = generateSlabBBS({
    memberTag: 'SLB-02',
    slabType: 'TWO_WAY',
    shortSpanLx: 3500,
    longSpanLy: 4200,
    thickness: 150,
    shortMainDia: 10,
    shortMainSpacing: 150,
    longMainDia: 10,
    longMainSpacing: 150,
  });
  console.log(`✓ SLB-02 (Two-Way): ${s2.length} items`);

  // 15. Double Jali Slab
  const s3 = generateSlabBBS({
    memberTag: 'SLB-03',
    slabType: 'DOUBLE_JALI',
    shortSpanLx: 4000,
    longSpanLy: 5000,
    thickness: 175,
    shortMainDia: 10,
    shortMainSpacing: 150,
    longMainDia: 10,
    longMainSpacing: 150,
    includeChairs: true,
  });
  console.log(`✓ SLB-03 (Double Jali): ${s3.length} items`);

  // 16. Plain PCC Mesh
  const pcc = generatePlainPccMeshBBS({
    memberTag: 'PCC-01',
    flooringType: 'PLAIN_PCC_WITH_MESH',
    length: 6000,
    width: 4000,
    thickness: 100,
    meshDiaX: 8,
    meshSpacingX: 150,
    meshDiaY: 8,
    meshSpacingY: 150,
  });
  console.log(`✓ PCC-01 (Plain PCC Mesh): ${pcc.length} items`);

  // 17. RCC Pardi / Shear Wall
  const sw = generateRccPardiBBS({
    memberTag: 'SW-01',
    wallType: 'RCC_PARDI',
    length: 3000,
    height: 3200,
    thickness: 200,
    vertMainDia: 12,
    vertMainSpacing: 150,
    horizDistDia: 10,
    horizDistSpacing: 150,
    includeEndCaps: true,
    includeCrossTies: true,
  });
  console.log(`✓ SW-01 (RCC Pardi): ${sw.length} items`);

  // 18. Staircase
  const str = generateStaircaseBBS({
    memberTag: 'STR-01',
    staircaseType: 'DOGLEGGED',
    waistThickness: 150,
    flightWidth: 1200,
    tread: 275,
    riser: 150,
    numberOfSteps: 10,
    landing1Length: 1200,
    landing2Length: 1200,
    mainBarDia: 12,
    mainBarSpacing: 125,
    distBarDia: 8,
    distBarSpacing: 150,
  });
  console.log(`✓ STR-01 (Staircase): ${str.length} items`);

  // 19. Water Tank Retaining Wall
  const wt = generateWaterTankBBS({
    memberTag: 'WT-01',
    structureType: 'UNDERGROUND_WATER_TANK',
    wallLength: 5000,
    wallHeight: 3000,
    wallThickness: 250,
    verticalDiaWaterFace: 12,
    verticalSpacingWaterFace: 150,
    verticalDiaOuterFace: 10,
    verticalSpacingOuterFace: 150,
    horizontalDiaWaterFace: 10,
    horizontalSpacingWaterFace: 150,
    horizontalDiaOuterFace: 10,
    horizontalSpacingOuterFace: 150,
  });
  console.log(`✓ WT-01 (Water Tank): ${wt.length} items`);

  console.log('\n--- ALL 19 MEMBER BBS GENERATORS EXECUTED WITH ZERO ERRORS! ---');
} catch (e) {
  console.error('Error during generator tests:', e);
}
