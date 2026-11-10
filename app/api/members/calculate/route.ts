import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateFootingBBS, FootingInput } from '@/lib/engine/members/footing';
import { generateColumnBBS, ColumnInput } from '@/lib/engine/members/column';
import { generateBeamBBS, BeamInput } from '@/lib/engine/members/beam';
import { generateSlabBBS, SlabInput } from '@/lib/engine/members/slab';
import { generateStaircaseBBS, StaircaseInput } from '@/lib/engine/members/staircase';
import { generateWaterTankBBS, WaterTankInput } from '@/lib/engine/members/waterTank';
import { generateRccPardiBBS, RccPardiInput } from '@/lib/engine/members/rccPardi';
import { generatePlainPccMeshBBS, PlainPccMeshInput } from '@/lib/engine/members/plainPccMesh';
import { calculateRebarShape, ShapeCalculationInput } from '@/lib/engine/is2502';
import { prisma } from '@/lib/prisma';
import { addMemberToProject } from '@/lib/cloudStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || '';
    const isSysAdmin = (session?.user as any)?.role === 'SYSTEM_ADMIN' || session?.user?.email === 'admin';

    const body = await request.json();
    const memberType = body.memberType || body.type;
    const input = body.input || body;
    const { projectId, saveToDatabase } = body;

    let items = [];

    switch (memberType?.toUpperCase()) {
      case 'FOOTING':
        items = generateFootingBBS(input as FootingInput);
        break;
      case 'COLUMN':
        items = generateColumnBBS(input as ColumnInput);
        break;
      case 'BEAM':
        items = generateBeamBBS(input as BeamInput);
        break;
      case 'SLAB':
        items = generateSlabBBS(input as SlabInput);
        break;
      case 'STAIRCASE':
        items = generateStaircaseBBS(input as StaircaseInput);
        break;
      case 'WATER_TANK':
      case 'RETAINING_WALL':
        items = generateWaterTankBBS(input as WaterTankInput);
        break;
      case 'RCC_PARDI':
      case 'PARDI':
      case 'SHEAR_WALL':
        items = generateRccPardiBBS(input as RccPardiInput);
        break;
      case 'PLAIN_PCC_MESH':
      case 'PCC':
      case 'GRADE_SLAB':
        items = generatePlainPccMeshBBS(input as PlainPccMeshInput);
        break;
      case 'CUSTOM_SHAPE':
        const shapeRes = calculateRebarShape(input as ShapeCalculationInput);
        return NextResponse.json({ success: true, shapeResult: shapeRes });
      default:
        return NextResponse.json({ error: `Unsupported member type: ${memberType}` }, { status: 400 });
    }

    // Save directly to Firestore Cloud Database if projectId is provided
    if (saveToDatabase && projectId) {
      let createdMember = null;
      try {
        createdMember = await addMemberToProject(
          projectId,
          {
            memberType: memberType.toUpperCase(),
            memberTag: input.memberTag || `${memberType}-1`,
            subType:
              input.footingType ||
              input.beamType ||
              input.columnShape ||
              input.slabType ||
              input.wallType ||
              input.flooringType ||
              input.staircaseType ||
              'STANDARD',
            dimensionsJson: input,
            rebarItems: items,
          },
          userId,
          isSysAdmin
        );
      } catch (cloudErr) {
        console.warn('[Members API] Firestore save warning:', cloudErr);
      }

      // Dual-sync to local Prisma SQLite if accessible
      try {
        await prisma.member.create({
          data: {
            id: createdMember?.id,
            projectId,
            memberType: memberType.toUpperCase(),
            memberTag: input.memberTag || `${memberType}-1`,
            subType:
              input.footingType ||
              input.beamType ||
              input.columnShape ||
              input.slabType ||
              input.wallType ||
              input.flooringType ||
              input.staircaseType ||
              'STANDARD',
            dimensionsJson: JSON.stringify(input),
            rebarItems: {
              create: items.map((item) => ({
                barMark: item.barMark || '1',
                shapeCode: item.shapeCode || '20',
                dia: item.dia || 12,
                count: item.count || 1,
                dimA: item.dimA || 0,
                dimB: item.dimB || 0,
                dimC: item.dimC || 0,
                dimD: item.dimD || 0,
                dimE: item.dimE || 0,
                calculatedCutLength: item.calculatedCutLength || 0,
                unitWeight: item.unitWeight || (item.dia * item.dia) / 162.2,
                isPayable: item.isPayable !== false,
                isChair: Boolean(item.isChair),
                isLap: Boolean(item.isLap),
                remarks: item.remarks ? `${item.description || ''} | ${item.remarks}`.trim() : item.description || '',
              })),
            },
          },
        });
      } catch (dbErr) {
        console.warn('[Members API] Prisma local cache warning:', dbErr);
      }

      return NextResponse.json({
        success: true,
        member: createdMember,
        items,
        totalWeightKg: Number(items.reduce((acc, i) => acc + i.totalWeightKg, 0).toFixed(2)),
      });
    }

    const totalWeightKg = Number(items.reduce((acc, i) => acc + i.totalWeightKg, 0).toFixed(2));
    const totalLengthM = Number(items.reduce((acc, i) => acc + i.totalLengthM, 0).toFixed(2));

    return NextResponse.json({
      success: true,
      memberType,
      items,
      totalWeightKg,
      totalLengthM,
    });
  } catch (error: any) {
    console.error('Member calculation error:', error);
    return NextResponse.json({ error: error.message || 'Calculation failed' }, { status: 500 });
  }
}
