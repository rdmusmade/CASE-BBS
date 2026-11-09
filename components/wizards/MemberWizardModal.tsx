'use client';

import React, { useState, useMemo } from 'react';
import { X, Check, Calculator, Sparkles, Box, Eye, Layers, ShieldCheck, ArrowRight, Plus, Minus } from 'lucide-react';
import { Rebar2DCanvas } from '../visualizer/Rebar2DCanvas';
import { Rebar3DViewer } from '../visualizer/Rebar3DViewer';
import { MemberStructuralSchematic } from '../visualizer/MemberStructuralSchematic';
import { generateFootingBBS } from '@/lib/engine/members/footing';
import { generateColumnBBS } from '@/lib/engine/members/column';
import { generateBeamBBS } from '@/lib/engine/members/beam';
import { generateSlabBBS } from '@/lib/engine/members/slab';
import { generateRccPardiBBS } from '@/lib/engine/members/rccPardi';
import { generatePlainPccMeshBBS } from '@/lib/engine/members/plainPccMesh';
import { generateStaircaseBBS } from '@/lib/engine/members/staircase';
import { STANDARD_BAR_DIAMETERS } from '@/lib/engine/is2502';

export type MemberCategory = 'FOOTING' | 'BEAM' | 'COLUMN' | 'SLAB' | 'RCC_PARDI' | 'PLAIN_PCC_MESH' | 'STAIRCASE';

export interface MemberWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSaveMember: (memberData: any) => Promise<void>;
  initialMemberType?: MemberCategory;
}

export const MemberWizardModal: React.FC<MemberWizardModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSaveMember,
  initialMemberType = 'BEAM',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MemberCategory>(initialMemberType);
  const [previewTab, setPreviewTab] = useState<'SCHEMATIC' | '2D_SHAPE' | '3D_WEBGL'>('SCHEMATIC');
  const [saving, setSaving] = useState(false);

  // Common Header
  const [memberTag, setMemberTag] = useState<string>('B101');
  const [concreteGrade, setConcreteGrade] = useState<string>('M25');
  const [steelGrade, setSteelGrade] = useState<string>('Fe500D');
  const [clearCover, setClearCover] = useState<number>(25);

  // -------------------------------------------------------------
  // 1. FOOTING STATES & SUBTYPES
  // -------------------------------------------------------------
  const [footingType, setFootingType] = useState<string>('ISOLATED');
  const [footingL, setFootingL] = useState<number>(2400);
  const [footingB, setFootingB] = useState<number>(2400);
  const [footingD, setFootingD] = useState<number>(600);
  // Bottom Reinforcement
  const [footingDiaX, setFootingDiaX] = useState<number>(12);
  const [footingSpacingX, setFootingSpacingX] = useState<number>(150);
  const [footingDiaY, setFootingDiaY] = useState<number>(12);
  const [footingSpacingY, setFootingSpacingY] = useState<number>(150);
  // Top Reinforcement
  const [footingTopMesh, setFootingTopMesh] = useState<boolean>(false);
  const [footingTopDiaX, setFootingTopDiaX] = useState<number>(12);
  const [footingTopSpacingX, setFootingTopSpacingX] = useState<number>(200);
  const [footingTopDiaY, setFootingTopDiaY] = useState<number>(12);
  const [footingTopSpacingY, setFootingTopSpacingY] = useState<number>(200);
  const [footingChairs, setFootingChairs] = useState<boolean>(true);
  // Stepped Footing specific
  const [stepL2, setStepL2] = useState<number>(1400);
  const [stepB2, setStepB2] = useState<number>(1400);
  const [stepD1, setStepD1] = useState<number>(300);
  const [stepD2, setStepD2] = useState<number>(300);
  // Sloped Footing specific
  const [edgeDepth, setEdgeDepth] = useState<number>(250);
  // Strap Footing specific
  const [strapLength, setStrapLength] = useState<number>(4000);
  const [strapWidth, setStrapWidth] = useState<number>(350);
  const [strapDepth, setStrapDepth] = useState<number>(600);
  const [strapTopDia, setStrapTopDia] = useState<number>(20);
  const [strapTopCount, setStrapTopCount] = useState<number>(4);
  const [strapBotDia, setStrapBotDia] = useState<number>(16);
  const [strapBotCount, setStrapBotCount] = useState<number>(3);
  const [strapStirrupDia, setStrapStirrupDia] = useState<number>(8);
  const [strapStirrupSpacing, setStrapStirrupSpacing] = useState<number>(150);

  // -------------------------------------------------------------
  // 2. BEAM STATES & SUBTYPES
  // -------------------------------------------------------------
  const [beamType, setBeamType] = useState<string>('SIMPLY_SUPPORTED');
  const [beamSpan, setBeamSpan] = useState<number>(5000); // Span 1 (Clear Span L1)
  const [beamSpan2, setBeamSpan2] = useState<number>(4500); // Span 2
  const [beamSpan3, setBeamSpan3] = useState<number>(0); // Span 3 (optional)
  const [beamWidth, setBeamWidth] = useState<number>(300);
  const [beamDepth, setBeamDepth] = useState<number>(600);
  const [beamSupportWidthLeft, setBeamSupportWidthLeft] = useState<number>(300);
  const [beamSupportWidthRight, setBeamSupportWidthRight] = useState<number>(300);
  const [beamCantLength, setBeamCantLength] = useState<number>(1500);

  // Top Reinforcement (Layer 1 & Layer 2 mixed)
  const [beamTopDia, setBeamTopDia] = useState<number>(16);
  const [beamTopCount, setBeamTopCount] = useState<number>(2);
  const [hasTopLayer2, setHasTopLayer2] = useState<boolean>(true);
  const [beamTopDia2, setBeamTopDia2] = useState<number>(12);
  const [beamTopCount2, setBeamTopCount2] = useState<number>(2);

  // Bottom Reinforcement (Layer 1 & Layer 2 mixed)
  const [beamBottomDia, setBeamBottomDia] = useState<number>(20);
  const [beamBottomCount, setBeamBottomCount] = useState<number>(2);
  const [hasBottomLayer2, setHasBottomLayer2] = useState<boolean>(true);
  const [beamBottomDia2, setBeamBottomDia2] = useState<number>(16);
  const [beamBottomCount2, setBeamBottomCount2] = useState<number>(2);

  // Stirrups (Confining End Zone vs Mid-Span Zone)
  const [beamStirrupDia, setBeamStirrupDia] = useState<number>(8);
  const [beamStirrupSpacingEnd, setBeamStirrupSpacingEnd] = useState<number>(100);
  const [beamStirrupSpacingMid, setBeamStirrupSpacingMid] = useState<number>(175);
  const [beamStirrupType, setBeamStirrupType] = useState<'2_LEG' | '4_LEG'>('2_LEG');

  // Support Top Extras
  const [topExtraLeftCount, setTopExtraLeftCount] = useState<number>(2);
  const [topExtraLeftDia, setTopExtraLeftDia] = useState<number>(16);
  const [topExtraRightCount, setTopExtraRightCount] = useState<number>(2);
  const [topExtraRightDia, setTopExtraRightDia] = useState<number>(16);

  // -------------------------------------------------------------
  // 3. COLUMN STATES
  // -------------------------------------------------------------
  const [columnShape, setColumnShape] = useState<string>('RECTANGULAR');
  const [colWidth, setColWidth] = useState<number>(400);
  const [colDepth, setColDepth] = useState<number>(600);
  const [colHeight, setColHeight] = useState<number>(3600);
  const [colMainDia, setColMainDia] = useState<number>(20);
  const [colMainCount, setColMainCount] = useState<number>(8);
  const [colTieDia, setColTieDia] = useState<number>(8);
  const [colTieSpacing, setColTieSpacing] = useState<number>(150);
  const [colIsStarter, setColIsStarter] = useState<boolean>(true);

  // -------------------------------------------------------------
  // 4. SLAB STATES
  // -------------------------------------------------------------
  const [slabType, setSlabType] = useState<string>('TWO_WAY_RESTRAINED');
  const [slabLx, setSlabLx] = useState<number>(3600);
  const [slabLy, setSlabLy] = useState<number>(4800);
  const [slabThick, setSlabThick] = useState<number>(150);
  const [slabMainDia, setSlabMainDia] = useState<number>(10);
  const [slabMainSpacing, setSlabMainSpacing] = useState<number>(150);
  const [slabDistDia, setSlabDistDia] = useState<number>(8);
  const [slabDistSpacing, setSlabDistSpacing] = useState<number>(175);
  const [slabCantBackSpan, setSlabCantBackSpan] = useState<number>(2700);

  // -------------------------------------------------------------
  // 5. RCC PARDI STATES
  // -------------------------------------------------------------
  const [pardiType, setPardiType] = useState<string>('RCC_PARDI');
  const [pardiLength, setPardiLength] = useState<number>(6000);
  const [pardiHeight, setPardiHeight] = useState<number>(3000);
  const [pardiThickness, setPardiThickness] = useState<number>(200);
  const [pardiVertDia, setPardiVertDia] = useState<number>(12);
  const [pardiVertSpacing, setPardiVertSpacing] = useState<number>(150);
  const [pardiHorizDia, setPardiHorizDia] = useState<number>(10);
  const [pardiHorizSpacing, setPardiHorizSpacing] = useState<number>(150);

  // -------------------------------------------------------------
  // 6. PLAIN PCC WITH MESH STATES
  // -------------------------------------------------------------
  const [pccType, setPccType] = useState<string>('PLAIN_PCC_WITH_MESH');
  const [pccLength, setPccLength] = useState<number>(8000);
  const [pccWidth, setPccWidth] = useState<number>(6000);
  const [pccThickness, setPccThickness] = useState<number>(125);
  const [pccMeshDia, setPccMeshDia] = useState<number>(8);
  const [pccMeshSpacing, setPccMeshSpacing] = useState<number>(150);

  // -------------------------------------------------------------
  // 7. STAIRCASE STATES
  // -------------------------------------------------------------
  const [stairType, setStairType] = useState<string>('DOGLEGGED');
  const [stairFlightWidth, setStairFlightWidth] = useState<number>(1200);
  const [stairWaist, setStairWaist] = useState<number>(160);
  const [stairTread, setStairTread] = useState<number>(275);
  const [stairRiser, setStairRiser] = useState<number>(150);
  const [stairSteps, setStairSteps] = useState<number>(10);
  const [stairLand1, setStairLand1] = useState<number>(1200);
  const [stairLand2, setStairLand2] = useState<number>(1200);
  const [stairMainDia, setStairMainDia] = useState<number>(12);
  const [stairMainSpacing, setStairMainSpacing] = useState<number>(150);
  const [stairDistDia, setStairDistDia] = useState<number>(8);
  const [stairDistSpacing, setStairDistSpacing] = useState<number>(175);

  // Recalculate preview BBS items
  const generatedItems = useMemo(() => {
    try {
      if (selectedCategory === 'FOOTING') {
        return generateFootingBBS({
          memberTag,
          footingType: footingType as any,
          length: footingL,
          width: footingB,
          depth: footingD,
          clearCover: 50,
          bottomDiaX: footingDiaX,
          bottomSpacingX: footingSpacingX,
          bottomDiaY: footingDiaY,
          bottomSpacingY: footingSpacingY,
          hasTopMesh: footingTopMesh,
          topDiaX: footingTopDiaX,
          topSpacingX: footingTopSpacingX,
          topDiaY: footingTopDiaY,
          topSpacingY: footingTopSpacingY,
          includeChairs: footingChairs,
          stepLength2: stepL2,
          stepWidth2: stepB2,
          stepDepth1: stepD1,
          stepDepth2: stepD2,
          edgeDepth,
          strapBeamLength: strapLength,
          strapBeamWidth: strapWidth,
          strapBeamDepth: strapDepth,
          strapTopDia,
          strapTopCount,
          strapBottomDia: strapBotDia,
          strapBottomCount: strapBotCount,
          strapStirrupDia,
          strapStirrupSpacing,
          steelGrade,
          concreteGrade,
        });
      } else if (selectedCategory === 'BEAM') {
        return generateBeamBBS({
          memberTag,
          beamType: beamType as any,
          clearSpan: beamSpan,
          span2Length: beamSpan2,
          span3Length: beamSpan3,
          width: beamWidth,
          depth: beamDepth,
          supportWidthLeft: beamSupportWidthLeft,
          supportWidthRight: beamSupportWidthRight,
          cantileverLengthRight: beamCantLength,
          topMainDia: beamTopDia,
          topMainCount: beamTopCount,
          topMainDia2: hasTopLayer2 ? beamTopDia2 : 0,
          topMainCount2: hasTopLayer2 ? beamTopCount2 : 0,
          bottomMainDia: beamBottomDia,
          bottomMainCount: beamBottomCount,
          bottomMainDia2: hasBottomLayer2 ? beamBottomDia2 : 0,
          bottomMainCount2: hasBottomLayer2 ? beamBottomCount2 : 0,
          stirrupDia: beamStirrupDia,
          stirrupSpacingSupport: beamStirrupSpacingEnd,
          stirrupSpacingMid: beamStirrupSpacingMid,
          stirrupType: beamStirrupType,
          topExtraLeftCount,
          topExtraLeftDia,
          topExtraRightCount,
          topExtraRightDia,
          clearCover: 25,
          steelGrade,
          concreteGrade,
        });
      } else if (selectedCategory === 'COLUMN') {
        return generateColumnBBS({
          memberTag,
          columnShape: columnShape as any,
          width: colWidth,
          depth: colDepth,
          clearHeight: colHeight,
          mainBarDia: colMainDia,
          mainBarCount: colMainCount,
          tieDia: colTieDia,
          tieSpacingNormal: colTieSpacing,
          tieSpacingConfined: 100,
          isStarterBar: colIsStarter,
          clearCover: 40,
          steelGrade,
          concreteGrade,
        });
      } else if (selectedCategory === 'SLAB') {
        return generateSlabBBS({
          memberTag,
          slabType: slabType as any,
          shortSpanLx: slabLx,
          longSpanLy: slabLy,
          thickness: slabThick,
          shortMainDia: slabMainDia,
          shortMainSpacing: slabMainSpacing,
          longMainDia: slabDistDia,
          longMainSpacing: slabDistSpacing,
          cantileverBackSpan: slabCantBackSpan,
          clearCover: 20,
          steelGrade,
          concreteGrade,
        });
      } else if (selectedCategory === 'RCC_PARDI') {
        return generateRccPardiBBS({
          memberTag,
          wallType: pardiType as any,
          length: pardiLength,
          height: pardiHeight,
          thickness: pardiThickness,
          vertMainDia: pardiVertDia,
          vertMainSpacing: pardiVertSpacing,
          horizDistDia: pardiHorizDia,
          horizDistSpacing: pardiHorizSpacing,
          includeEndCaps: true,
          includeCrossTies: true,
          clearCover: 30,
          steelGrade,
          concreteGrade,
        });
      } else if (selectedCategory === 'PLAIN_PCC_MESH') {
        return generatePlainPccMeshBBS({
          memberTag,
          flooringType: pccType as any,
          length: pccLength,
          width: pccWidth,
          thickness: pccThickness,
          meshDiaX: pccMeshDia,
          meshSpacingX: pccMeshSpacing,
          meshDiaY: pccMeshDia,
          meshSpacingY: pccMeshSpacing,
          clearCover: 30,
          steelGrade,
          concreteGrade,
        });
      } else if (selectedCategory === 'STAIRCASE') {
        return generateStaircaseBBS({
          memberTag,
          staircaseType: stairType as any,
          flightWidth: stairFlightWidth,
          waistThickness: stairWaist,
          tread: stairTread,
          riser: stairRiser,
          numberOfSteps: stairSteps,
          landing1Length: stairLand1,
          landing2Length: stairLand2,
          mainBarDia: stairMainDia,
          mainBarSpacing: stairMainSpacing,
          distBarDia: stairDistDia,
          distBarSpacing: stairDistSpacing,
          clearCover: 20,
          steelGrade,
          concreteGrade,
        });
      }
      return [];
    } catch (e) {
      console.error('Preview BBS calculation error:', e);
      return [];
    }
  }, [
    selectedCategory,
    memberTag,
    concreteGrade,
    steelGrade,
    footingType,
    footingL,
    footingB,
    footingD,
    footingDiaX,
    footingSpacingX,
    footingDiaY,
    footingSpacingY,
    footingTopMesh,
    footingTopDiaX,
    footingTopSpacingX,
    footingTopDiaY,
    footingTopSpacingY,
    footingChairs,
    stepL2,
    stepB2,
    stepD1,
    stepD2,
    edgeDepth,
    strapLength,
    strapWidth,
    strapDepth,
    strapTopDia,
    strapTopCount,
    strapBotDia,
    strapBotCount,
    strapStirrupDia,
    strapStirrupSpacing,
    beamType,
    beamSpan,
    beamSpan2,
    beamSpan3,
    beamWidth,
    beamDepth,
    beamSupportWidthLeft,
    beamSupportWidthRight,
    beamCantLength,
    beamTopDia,
    beamTopCount,
    hasTopLayer2,
    beamTopDia2,
    beamTopCount2,
    beamBottomDia,
    beamBottomCount,
    hasBottomLayer2,
    beamBottomDia2,
    beamBottomCount2,
    beamStirrupDia,
    beamStirrupSpacingEnd,
    beamStirrupSpacingMid,
    beamStirrupType,
    topExtraLeftCount,
    topExtraLeftDia,
    topExtraRightCount,
    topExtraRightDia,
    columnShape,
    colWidth,
    colDepth,
    colHeight,
    colMainDia,
    colMainCount,
    colTieDia,
    colTieSpacing,
    colIsStarter,
    slabType,
    slabLx,
    slabLy,
    slabThick,
    slabMainDia,
    slabMainSpacing,
    slabDistDia,
    slabDistSpacing,
    slabCantBackSpan,
    pardiType,
    pardiLength,
    pardiHeight,
    pardiThickness,
    pardiVertDia,
    pardiVertSpacing,
    pardiHorizDia,
    pardiHorizSpacing,
    pccType,
    pccLength,
    pccWidth,
    pccThickness,
    pccMeshDia,
    pccMeshSpacing,
    stairType,
    stairFlightWidth,
    stairWaist,
    stairTread,
    stairRiser,
    stairSteps,
    stairLand1,
    stairLand2,
    stairMainDia,
    stairMainSpacing,
    stairDistDia,
    stairDistSpacing,
  ]);

  const totalCalculatedWeightKg = generatedItems.reduce((acc, i) => acc + i.totalWeightKg, 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      let inputParams: any = { memberTag, concreteGrade, steelGrade };

      if (selectedCategory === 'FOOTING') {
        inputParams = {
          ...inputParams,
          footingType,
          length: footingL,
          width: footingB,
          depth: footingD,
          clearCover: 50,
          bottomDiaX: footingDiaX,
          bottomSpacingX: footingSpacingX,
          bottomDiaY: footingDiaY,
          bottomSpacingY: footingSpacingY,
          hasTopMesh: footingTopMesh,
          topDiaX: footingTopDiaX,
          topSpacingX: footingTopSpacingX,
          topDiaY: footingTopDiaY,
          topSpacingY: footingTopSpacingY,
          includeChairs: footingChairs,
          stepLength2: stepL2,
          stepWidth2: stepB2,
          stepDepth1: stepD1,
          stepDepth2: stepD2,
          edgeDepth,
          strapBeamLength: strapLength,
          strapBeamWidth: strapWidth,
          strapBeamDepth: strapDepth,
          strapTopDia,
          strapTopCount,
          strapBottomDia: strapBotDia,
          strapBottomCount: strapBotCount,
          strapStirrupDia,
          strapStirrupSpacing,
        };
      } else if (selectedCategory === 'BEAM') {
        inputParams = {
          ...inputParams,
          beamType,
          clearSpan: beamSpan,
          span2Length: beamSpan2,
          span3Length: beamSpan3,
          width: beamWidth,
          depth: beamDepth,
          supportWidthLeft: beamSupportWidthLeft,
          supportWidthRight: beamSupportWidthRight,
          cantileverLengthRight: beamCantLength,
          topMainDia: beamTopDia,
          topMainCount: beamTopCount,
          topMainDia2: hasTopLayer2 ? beamTopDia2 : 0,
          topMainCount2: hasTopLayer2 ? beamTopCount2 : 0,
          bottomMainDia: beamBottomDia,
          bottomMainCount: beamBottomCount,
          bottomMainDia2: hasBottomLayer2 ? beamBottomDia2 : 0,
          bottomMainCount2: hasBottomLayer2 ? beamBottomCount2 : 0,
          stirrupDia: beamStirrupDia,
          stirrupSpacingSupport: beamStirrupSpacingEnd,
          stirrupSpacingMid: beamStirrupSpacingMid,
          stirrupType: beamStirrupType,
          topExtraLeftCount,
          topExtraLeftDia,
          topExtraRightCount,
          topExtraRightDia,
          clearCover: 25,
        };
      } else if (selectedCategory === 'COLUMN') {
        inputParams = {
          ...inputParams,
          columnShape,
          width: colWidth,
          depth: colDepth,
          clearHeight: colHeight,
          mainBarDia: colMainDia,
          mainBarCount: colMainCount,
          tieDia: colTieDia,
          tieSpacingNormal: colTieSpacing,
          isStarterBar: colIsStarter,
          clearCover: 40,
        };
      } else if (selectedCategory === 'SLAB') {
        inputParams = {
          ...inputParams,
          slabType,
          shortSpanLx: slabLx,
          longSpanLy: slabLy,
          thickness: slabThick,
          shortMainDia: slabMainDia,
          shortMainSpacing: slabMainSpacing,
          longMainDia: slabDistDia,
          longMainSpacing: slabDistSpacing,
          cantileverBackSpan: slabCantBackSpan,
          clearCover: 20,
        };
      } else if (selectedCategory === 'RCC_PARDI') {
        inputParams = {
          ...inputParams,
          wallType: pardiType,
          length: pardiLength,
          height: pardiHeight,
          thickness: pardiThickness,
          vertMainDia: pardiVertDia,
          vertMainSpacing: pardiVertSpacing,
          horizDistDia: pardiHorizDia,
          horizDistSpacing: pardiHorizSpacing,
          clearCover: 30,
        };
      } else if (selectedCategory === 'PLAIN_PCC_MESH') {
        inputParams = {
          ...inputParams,
          flooringType: pccType,
          length: pccLength,
          width: pccWidth,
          thickness: pccThickness,
          meshDiaX: pccMeshDia,
          meshSpacingX: pccMeshSpacing,
          clearCover: 30,
        };
      } else if (selectedCategory === 'STAIRCASE') {
        inputParams = {
          ...inputParams,
          staircaseType: stairType,
          flightWidth: stairFlightWidth,
          waistThickness: stairWaist,
          tread: stairTread,
          riser: stairRiser,
          numberOfSteps: stairSteps,
          landing1Length: stairLand1,
          landing2Length: stairLand2,
          mainBarDia: stairMainDia,
          mainBarSpacing: stairMainSpacing,
          distBarDia: stairDistDia,
          distBarSpacing: stairDistSpacing,
          clearCover: 20,
        };
      }

      await onSaveMember({
        projectId,
        memberType: selectedCategory,
        input: inputParams,
        saveToDatabase: true,
      });

      onClose();
    } catch (e) {
      console.error('Save member error:', e);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                Structural Member Wizard & Detailing
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  IS 2502 / IS 456 / IS 13920
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                100% accurate mathematical execution • Sub-type specific detailing • Layered rebar entry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tab Bar (7 Structural Member Categories) */}
        <div className="flex items-center gap-1.5 px-6 py-2 bg-slate-950/90 border-b border-slate-800 overflow-x-auto">
          {[
            { id: 'FOOTING', label: '1. Footings (Step / Strap / Raft)' },
            { id: 'BEAM', label: '2. Beams (Simple / Continuous / Cantilever)' },
            { id: 'COLUMN', label: '3. Columns (Rect / Spiral)' },
            { id: 'SLAB', label: '4. Slabs (1-Way / 2-Way / Balcony)' },
            { id: 'RCC_PARDI', label: '5. RCC Pardi / Retaining Walls' },
            { id: 'PLAIN_PCC_MESH', label: '6. Plain PCC with Steel Mesh' },
            { id: 'STAIRCASE', label: '7. Staircase (Doglegged Cross-Over)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedCategory(tab.id as MemberCategory);
                if (tab.id === 'FOOTING') setMemberTag('F1');
                if (tab.id === 'BEAM') setMemberTag('B101');
                if (tab.id === 'COLUMN') setMemberTag('C1');
                if (tab.id === 'SLAB') setMemberTag('S1');
                if (tab.id === 'RCC_PARDI') setMemberTag('PARDI-1');
                if (tab.id === 'PLAIN_PCC_MESH') setMemberTag('PCC-1');
                if (tab.id === 'STAIRCASE') setMemberTag('STR-1');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === tab.id
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body: Left Inputs, Right CAD Drawing / 3D / Live BBS Table */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: Data Entry Forms (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Common Member Tag & Concrete Grade */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Member Tag</label>
                  <input
                    type="text"
                    value={memberTag}
                    onChange={(e) => setMemberTag(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Concrete Grade</label>
                  <select
                    value={concreteGrade}
                    onChange={(e) => setConcreteGrade(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="M20">M20</option>
                    <option value="M25">M25</option>
                    <option value="M30">M30</option>
                    <option value="M35">M35</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Steel Grade (IS 1786)</label>
                  <select
                    value={steelGrade}
                    onChange={(e) => setSteelGrade(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Fe415">Fe 415</option>
                    <option value="Fe500D">Fe 500D (TMT)</option>
                    <option value="Fe550D">Fe 550D (High Tensile)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 1. FOOTINGS DATA ENTRY */}
            {selectedCategory === 'FOOTING' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Footing Geometry & Sub-Type
                  </h4>
                  <span className="text-[10px] text-slate-500">IS 456 Cl. 34 Foundation Cover = 50mm</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sub-Type Variation</label>
                  <select
                    value={footingType}
                    onChange={(e) => setFootingType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-sky-500"
                  >
                    <option value="ISOLATED">Isolated Pad Footing</option>
                    <option value="STEPPED">Stepped Footing (Multi-Tier)</option>
                    <option value="SLOPED_TRAPEZOIDAL">Sloped / Trapezoidal Footing</option>
                    <option value="STRAP">Strap Footing (Connected with Strap Beam)</option>
                    <option value="COMBINED">Combined Footing (Dual Column)</option>
                    <option value="RAFT">Raft Foundation Mat with Spacer Chairs</option>
                    <option value="PILE_CAP">Pile Cap</option>
                  </select>
                </div>

                {/* Primary Base Dimensions */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Length L (mm)</label>
                    <input
                      type="number"
                      value={footingL}
                      onChange={(e) => setFootingL(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Width B (mm)</label>
                    <input
                      type="number"
                      value={footingB}
                      onChange={(e) => setFootingB(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Overall Depth D (mm)</label>
                    <input
                      type="number"
                      value={footingD}
                      onChange={(e) => setFootingD(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>

                {/* SUBTYPE SPECIFIC: STEPPED FOOTING */}
                {footingType === 'STEPPED' && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/30 space-y-2">
                    <span className="text-[11px] font-bold text-purple-300 block">Upper Tier Step Geometry</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Step 2 Length L2 (mm)</label>
                        <input
                          type="number"
                          value={stepL2}
                          onChange={(e) => setStepL2(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Step 2 Width B2 (mm)</label>
                        <input
                          type="number"
                          value={stepB2}
                          onChange={(e) => setStepB2(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Lower Depth D1 (mm)</label>
                        <input
                          type="number"
                          value={stepD1}
                          onChange={(e) => setStepD1(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Upper Depth D2 (mm)</label>
                        <input
                          type="number"
                          value={stepD2}
                          onChange={(e) => setStepD2(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTYPE SPECIFIC: SLOPED FOOTING */}
                {footingType === 'SLOPED_TRAPEZOIDAL' && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-2">
                    <span className="text-[11px] font-bold text-amber-300 block">Sloped Trapezoidal Parameters</span>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Edge Thickness d_edge (min 150mm per IS 456 Cl. 34.1.2)
                      </label>
                      <input
                        type="number"
                        value={edgeDepth}
                        onChange={(e) => setEdgeDepth(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                      />
                    </div>
                  </div>
                )}

                {/* SUBTYPE SPECIFIC: STRAP FOOTING */}
                {footingType === 'STRAP' && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-300 block">Connecting Strap Beam</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Strap Length (mm)</label>
                        <input
                          type="number"
                          value={strapLength}
                          onChange={(e) => setStrapLength(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Strap Width (mm)</label>
                        <input
                          type="number"
                          value={strapWidth}
                          onChange={(e) => setStrapWidth(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Strap Depth (mm)</label>
                        <input
                          type="number"
                          value={strapDepth}
                          onChange={(e) => setStrapDepth(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Reinforcement (X & Y) */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Bottom Reinforcement Mesh</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">X-Direction Main Rebar</label>
                      <div className="flex gap-1.5">
                        <select
                          value={footingDiaX}
                          onChange={(e) => setFootingDiaX(Number(e.target.value))}
                          className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-mono font-bold"
                        >
                          {STANDARD_BAR_DIAMETERS.map((d) => (
                            <option key={d} value={d}>
                              Ø {d}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={footingSpacingX}
                          onChange={(e) => setFootingSpacingX(Number(e.target.value))}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                          placeholder="Spacing c/c"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Y-Direction Main Rebar</label>
                      <div className="flex gap-1.5">
                        <select
                          value={footingDiaY}
                          onChange={(e) => setFootingDiaY(Number(e.target.value))}
                          className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-mono font-bold"
                        >
                          {STANDARD_BAR_DIAMETERS.map((d) => (
                            <option key={d} value={d}>
                              Ø {d}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={footingSpacingY}
                          onChange={(e) => setFootingSpacingY(Number(e.target.value))}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                          placeholder="Spacing c/c"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Reinforcement Checkbox & Fields */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-200 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={footingTopMesh || footingType === 'RAFT' || footingType === 'COMBINED'}
                        onChange={(e) => setFootingTopMesh(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-sky-500"
                      />
                      Enable Top Reinforcement Mesh (Raft / Combined / High Moment)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={footingChairs}
                        onChange={(e) => setFootingChairs(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-sky-500"
                      />
                      Include 3D Spacer Chairs
                    </label>
                  </div>

                  {(footingTopMesh || footingType === 'RAFT' || footingType === 'COMBINED') && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
                      <span className="text-[11px] font-bold text-emerald-400 block">Top Reinforcement Inputs</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Top Mesh X Rebar</label>
                          <div className="flex gap-1.5">
                            <select
                              value={footingTopDiaX}
                              onChange={(e) => setFootingTopDiaX(Number(e.target.value))}
                              className="w-24 bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs text-slate-100 font-mono font-bold"
                            >
                              {STANDARD_BAR_DIAMETERS.map((d) => (
                                <option key={d} value={d}>
                                  Ø {d}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={footingTopSpacingX}
                              onChange={(e) => setFootingTopSpacingX(Number(e.target.value))}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                              placeholder="c/c"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Top Mesh Y Rebar</label>
                          <div className="flex gap-1.5">
                            <select
                              value={footingTopDiaY}
                              onChange={(e) => setFootingTopDiaY(Number(e.target.value))}
                              className="w-24 bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs text-slate-100 font-mono font-bold"
                            >
                              {STANDARD_BAR_DIAMETERS.map((d) => (
                                <option key={d} value={d}>
                                  Ø {d}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={footingTopSpacingY}
                              onChange={(e) => setFootingTopSpacingY(Number(e.target.value))}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                              placeholder="c/c"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. BEAMS DATA ENTRY */}
            {selectedCategory === 'BEAM' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Beam Detailing & Multi-Span Controls
                  </h4>
                  <span className="text-[10px] text-slate-500">IS 13920 Ductile Detailing Active</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Beam Combination Type</label>
                  <select
                    value={beamType}
                    onChange={(e) => setBeamType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-sky-500"
                  >
                    <option value="SIMPLY_SUPPORTED">Simply Supported Beam</option>
                    <option value="CONTINUOUS">Continuous Multi-Span Beam (2 or 3 Spans)</option>
                    <option value="CANTILEVER">Cantilever Beam (Ld Support Anchor)</option>
                    <option value="CONTINUOUS_WITH_CANTILEVER">Continuous Beam with Cantilever Overhang</option>
                    <option value="FIXED">Fixed / Encastre Beam</option>
                    <option value="DEEP">Deep Beam (Depth &gt; 750mm Side-Face Steel)</option>
                  </select>
                </div>

                {/* Spans & Cross-Section */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Clear Span L1 (mm)</label>
                    <input
                      type="number"
                      value={beamSpan}
                      onChange={(e) => setBeamSpan(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Width b (mm)</label>
                    <input
                      type="number"
                      value={beamWidth}
                      onChange={(e) => setBeamWidth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Depth D (mm)</label>
                    <input
                      type="number"
                      value={beamDepth}
                      onChange={(e) => setBeamDepth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>

                {/* MULTI-SPAN CONTINUOUS INPUTS */}
                {(beamType === 'CONTINUOUS' || beamType === 'CONTINUOUS_WITH_CANTILEVER') && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-sky-500/30 space-y-2">
                    <span className="text-[11px] font-bold text-sky-300 block">Additional Spans & Column Supports</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Span 2 Length L2 (mm)</label>
                        <input
                          type="number"
                          value={beamSpan2}
                          onChange={(e) => setBeamSpan2(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Span 3 Length L3 (mm, optional)</label>
                        <input
                          type="number"
                          value={beamSpan3}
                          onChange={(e) => setBeamSpan3(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs font-mono text-slate-100"
                          placeholder="0 if 2 spans"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* LAYERED TOP REBAR (Layer 1 + Layer 2 Mixed) */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Top Main Bars (Hanger / Tension)</span>
                    <label className="flex items-center gap-1.5 text-[11px] text-sky-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasTopLayer2}
                        onChange={(e) => setHasTopLayer2(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-sky-500"
                      />
                      + Mixed Layer 2 (e.g. 2-T16 + 2-T12)
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Top Layer 1 */}
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Layer 1 (Count / Dia)</span>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={beamTopCount}
                          onChange={(e) => setBeamTopCount(Number(e.target.value))}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                        />
                        <select
                          value={beamTopDia}
                          onChange={(e) => setBeamTopDia(Number(e.target.value))}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-100"
                        >
                          {STANDARD_BAR_DIAMETERS.map((d) => (
                            <option key={d} value={d}>
                              Ø {d} mm
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Top Layer 2 */}
                    {hasTopLayer2 ? (
                      <div>
                        <span className="text-[10px] text-sky-400 block mb-0.5">Layer 2 Mixed (Count / Dia)</span>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            value={beamTopCount2}
                            onChange={(e) => setBeamTopCount2(Number(e.target.value))}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                          />
                          <select
                            value={beamTopDia2}
                            onChange={(e) => setBeamTopDia2(Number(e.target.value))}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-100"
                          >
                            {STANDARD_BAR_DIAMETERS.map((d) => (
                              <option key={d} value={d}>
                                Ø {d} mm
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-[10px] text-slate-500 italic">
                        Single diameter top reinforcement
                      </div>
                    )}
                  </div>
                </div>

                {/* LAYERED BOTTOM REBAR (Layer 1 + Layer 2 Mixed) */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Bottom Main Tension Bars</span>
                    <label className="flex items-center gap-1.5 text-[11px] text-emerald-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasBottomLayer2}
                        onChange={(e) => setHasBottomLayer2(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-sky-500"
                      />
                      + Mixed Layer 2 (e.g. 2-T20 + 2-T16)
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Bottom Layer 1 */}
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Layer 1 (Count / Dia)</span>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={beamBottomCount}
                          onChange={(e) => setBeamBottomCount(Number(e.target.value))}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                        />
                        <select
                          value={beamBottomDia}
                          onChange={(e) => setBeamBottomDia(Number(e.target.value))}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-100"
                        >
                          {STANDARD_BAR_DIAMETERS.map((d) => (
                            <option key={d} value={d}>
                              Ø {d} mm
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Bottom Layer 2 */}
                    {hasBottomLayer2 ? (
                      <div>
                        <span className="text-[10px] text-emerald-400 block mb-0.5">Layer 2 Mixed (Count / Dia)</span>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            value={beamBottomCount2}
                            onChange={(e) => setBeamBottomCount2(Number(e.target.value))}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                          />
                          <select
                            value={beamBottomDia2}
                            onChange={(e) => setBeamBottomDia2(Number(e.target.value))}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-100"
                          >
                            {STANDARD_BAR_DIAMETERS.map((d) => (
                              <option key={d} value={d}>
                                Ø {d} mm
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-[10px] text-slate-500 italic">
                        Single diameter bottom reinforcement
                      </div>
                    )}
                  </div>
                </div>

                {/* VARYING STIRRUPS SPACING (End vs Mid-Span) */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">
                    135° Shear Stirrups (Dual-Zone Spacing per IS 13920)
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Stirrup Dia Ø</label>
                      <select
                        value={beamStirrupDia}
                        onChange={(e) => setBeamStirrupDia(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-100"
                      >
                        {STANDARD_BAR_DIAMETERS.map((d) => (
                          <option key={d} value={d}>
                            Ø {d} mm
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-sky-400 mb-0.5">End Confining (mm c/c)</label>
                      <input
                        type="number"
                        value={beamStirrupSpacingEnd}
                        onChange={(e) => setBeamStirrupSpacingEnd(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Mid-Span (mm c/c)</label>
                      <input
                        type="number"
                        value={beamStirrupSpacingMid}
                        onChange={(e) => setBeamStirrupSpacingMid(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                        placeholder="175"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. COLUMNS DATA ENTRY */}
            {selectedCategory === 'COLUMN' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Column Cross-Section & Ties
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Width b (mm)</label>
                    <input
                      type="number"
                      value={colWidth}
                      onChange={(e) => setColWidth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Depth D (mm)</label>
                    <input
                      type="number"
                      value={colDepth}
                      onChange={(e) => setColDepth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Clear Height (mm)</label>
                    <input
                      type="number"
                      value={colHeight}
                      onChange={(e) => setColHeight(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Main Bar Count</label>
                    <input
                      type="number"
                      value={colMainCount}
                      onChange={(e) => setColMainCount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Main Bar Dia Ø</label>
                    <select
                      value={colMainDia}
                      onChange={(e) => setColMainDia(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-100"
                    >
                      {STANDARD_BAR_DIAMETERS.map((d) => (
                        <option key={d} value={d}>
                          Ø {d} mm
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tie / Link Dia Ø</label>
                    <select
                      value={colTieDia}
                      onChange={(e) => setColTieDia(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-100"
                    >
                      {STANDARD_BAR_DIAMETERS.map((d) => (
                        <option key={d} value={d}>
                          Ø {d} mm
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tie Spacing (mm c/c)</label>
                    <input
                      type="number"
                      value={colTieSpacing}
                      onChange={(e) => setColTieSpacing(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    checked={colIsStarter}
                    onChange={(e) => setColIsStarter(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-sky-500"
                  />
                  <span className="text-xs text-slate-300">Footing Starter L-Bend Anchor (≥ 300mm per IS 456)</span>
                </div>
              </div>
            )}

            {/* 4. SLABS DATA ENTRY */}
            {selectedCategory === 'SLAB' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Slab Detailing</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Short Span Lx (mm)</label>
                    <input
                      type="number"
                      value={slabLx}
                      onChange={(e) => setSlabLx(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Long Span Ly (mm)</label>
                    <input
                      type="number"
                      value={slabLy}
                      onChange={(e) => setSlabLy(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Thickness (mm)</label>
                    <input
                      type="number"
                      value={slabThick}
                      onChange={(e) => setSlabThick(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Short Span Rebar Ø @ Spacing</label>
                    <div className="flex gap-1.5">
                      <select
                        value={slabMainDia}
                        onChange={(e) => setSlabMainDia(Number(e.target.value))}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-mono font-bold"
                      >
                        {STANDARD_BAR_DIAMETERS.map((d) => (
                          <option key={d} value={d}>
                            Ø {d}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={slabMainSpacing}
                        onChange={(e) => setSlabMainSpacing(Number(e.target.value))}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Long Span Rebar Ø @ Spacing</label>
                    <div className="flex gap-1.5">
                      <select
                        value={slabDistDia}
                        onChange={(e) => setSlabDistDia(Number(e.target.value))}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-100 font-mono font-bold"
                      >
                        {STANDARD_BAR_DIAMETERS.map((d) => (
                          <option key={d} value={d}>
                            Ø {d}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={slabDistSpacing}
                        onChange={(e) => setSlabDistSpacing(Number(e.target.value))}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. RCC PARDI */}
            {selectedCategory === 'RCC_PARDI' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">RCC Pardi / Wall Detailing</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Length L (mm)</label>
                    <input
                      type="number"
                      value={pardiLength}
                      onChange={(e) => setPardiLength(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Height H (mm)</label>
                    <input
                      type="number"
                      value={pardiHeight}
                      onChange={(e) => setPardiHeight(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Thickness T (mm)</label>
                    <input
                      type="number"
                      value={pardiThickness}
                      onChange={(e) => setPardiThickness(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Vertical Main Dia Ø</label>
                    <select
                      value={pardiVertDia}
                      onChange={(e) => setPardiVertDia(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-100"
                    >
                      {STANDARD_BAR_DIAMETERS.map((d) => (
                        <option key={d} value={d}>
                          Ø {d} mm
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Vert Spacing (mm c/c)</label>
                    <input
                      type="number"
                      value={pardiVertSpacing}
                      onChange={(e) => setPardiVertSpacing(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. PLAIN PCC WITH MESH */}
            {selectedCategory === 'PLAIN_PCC_MESH' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">PCC Plinth Floor with Mesh</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Length L (mm)</label>
                    <input
                      type="number"
                      value={pccLength}
                      onChange={(e) => setPccLength(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Width B (mm)</label>
                    <input
                      type="number"
                      value={pccWidth}
                      onChange={(e) => setPccWidth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Thickness (mm)</label>
                    <input
                      type="number"
                      value={pccThickness}
                      onChange={(e) => setPccThickness(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mesh Bar Dia Ø</label>
                    <select
                      value={pccMeshDia}
                      onChange={(e) => setPccMeshDia(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-100"
                    >
                      {STANDARD_BAR_DIAMETERS.map((d) => (
                        <option key={d} value={d}>
                          Ø {d} mm
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Grid Spacing (mm c/c)</label>
                    <input
                      type="number"
                      value={pccMeshSpacing}
                      onChange={(e) => setPccMeshSpacing(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. STAIRCASE */}
            {selectedCategory === 'STAIRCASE' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Staircase Geometry</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Flight Width (mm)</label>
                    <input
                      type="number"
                      value={stairFlightWidth}
                      onChange={(e) => setStairFlightWidth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Waist (mm)</label>
                    <input
                      type="number"
                      value={stairWaist}
                      onChange={(e) => setStairWaist(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Steps Count</label>
                    <input
                      type="number"
                      value={stairSteps}
                      onChange={(e) => setStairSteps(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Waist Main Rebar Ø</label>
                    <select
                      value={stairMainDia}
                      onChange={(e) => setStairMainDia(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-100"
                    >
                      {STANDARD_BAR_DIAMETERS.map((d) => (
                        <option key={d} value={d}>
                          Ø {d} mm
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Spacing (mm c/c)</label>
                    <input
                      type="number"
                      value={stairMainSpacing}
                      onChange={(e) => setStairMainSpacing(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Interactive Visualizer & BBS Output (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            {/* View Mode Tabs */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">Live Visual Inspection</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewTab('SCHEMATIC')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewTab === 'SCHEMATIC' ? 'bg-sky-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📐 Structural CAD Drawing
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('2D_SHAPE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewTab === '2D_SHAPE' ? 'bg-sky-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔍 Bar Bending Details
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('3D_WEBGL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewTab === '3D_WEBGL' ? 'bg-sky-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🌐 3D WebGL
                </button>
              </div>
            </div>

            {/* Visualizer Canvas Area */}
            <div className="h-[250px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              {previewTab === 'SCHEMATIC' ? (
                <MemberStructuralSchematic
                  category={selectedCategory}
                  subType={footingType || beamType || columnShape}
                  memberTag={memberTag}
                  params={{
                    length: footingL,
                    width: footingB || beamWidth || colWidth,
                    depth: footingD || beamDepth || colDepth,
                    height: colHeight,
                    clearCover: selectedCategory === 'FOOTING' ? 50 : 25,
                    concreteGrade,
                    steelGrade,
                    footingType,
                    stepLength2: stepL2,
                    stepDepth1: stepD1,
                    stepDepth2: stepD2,
                    edgeDepth,
                    bottomDiaX: footingDiaX,
                    bottomSpacingX: footingSpacingX,
                    bottomDiaY: footingDiaY,
                    bottomSpacingY: footingSpacingY,
                    hasTopMesh: footingTopMesh,
                    topDiaX: footingTopDiaX,
                    topSpacingX: footingTopSpacingX,
                    beamType,
                    clearSpan: beamSpan,
                    span2Length: beamSpan2,
                    span3Length: beamSpan3,
                    topMainDia: beamTopDia,
                    topMainCount: beamTopCount,
                    topMainDia2: hasTopLayer2 ? beamTopDia2 : 0,
                    topMainCount2: hasTopLayer2 ? beamTopCount2 : 0,
                    bottomMainDia: beamBottomDia,
                    bottomMainCount: beamBottomCount,
                    bottomMainDia2: hasBottomLayer2 ? beamBottomDia2 : 0,
                    bottomMainCount2: hasBottomLayer2 ? beamBottomCount2 : 0,
                    stirrupDia: beamStirrupDia,
                    stirrupSpacingSupport: beamStirrupSpacingEnd,
                    stirrupSpacingMid: beamStirrupSpacingMid,
                    colMainDia,
                    colMainCount,
                    colTieDia,
                    colTieSpacing,
                  }}
                />
              ) : previewTab === '2D_SHAPE' ? (
                generatedItems.length > 0 ? (
                  <Rebar2DCanvas
                    shapeCode={generatedItems[0].shapeCode}
                    dia={generatedItems[0].dia}
                    dimA={generatedItems[0].dimA}
                    dimB={generatedItems[0].dimB}
                    dimC={generatedItems[0].dimC}
                    calculatedCutLength={generatedItems[0].calculatedCutLength}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                    Calculating...
                  </div>
                )
              ) : generatedItems.length > 0 ? (
                <Rebar3DViewer
                  shapeCode={generatedItems[0].shapeCode}
                  dia={generatedItems[0].dia}
                  dimA={generatedItems[0].dimA}
                  dimB={generatedItems[0].dimB}
                  dimC={generatedItems[0].dimC}
                  dimD={generatedItems[0].dimD}
                  dimE={generatedItems[0].dimE}
                  calculatedCutLength={generatedItems[0].calculatedCutLength}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                  Calculating 3D mesh...
                </div>
              )}
            </div>

            {/* Generated Rebar Schedule List */}
            <div className="flex-1 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 overflow-y-auto max-h-[200px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-bold text-slate-300">Generated Rebar Schedule</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Total: {totalCalculatedWeightKg.toFixed(1)} kg ({(totalCalculatedWeightKg / 1000).toFixed(3)} MT)
                </span>
              </div>

              <div className="space-y-1.5">
                {generatedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">
                        <span className="font-mono text-sky-400 mr-1.5">[{item.barMark}]</span>
                        {item.description}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Shape {item.shapeCode} • Ø{item.dia}mm • {item.count} nos @ Cut L: {item.calculatedCutLength}mm
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-100">{item.totalWeightKg} kg</div>
                      <div className="text-[10px] font-mono text-slate-500">{item.totalLengthM} m</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save & Cancel Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">
                {generatedItems.length} cut schedule lines ready
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || generatedItems.length === 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add to BBS Project'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
