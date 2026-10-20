import { StructuralProject } from '../types/structural';

export interface StructuralCalculations {
  totalSteelWeightKg: number;
  totalSteelTonnage: number;
  estimatedRebarCost: number;
  designFeeAmount: number;
  supervisionFeeAmount: number;
  totalEngineeringFee: number;
  steelWeightByDiameter: Record<number, number>;
}

export function calculateStructuralProject(project: StructuralProject): StructuralCalculations {
  let totalSteelWeightKg = 0;
  const steelWeightByDiameter: Record<number, number> = {
    8: 0,
    10: 0,
    12: 0,
    16: 0,
    20: 0,
    25: 0,
    32: 0,
  };

  for (const item of project.bbsItems) {
    const totalBars = (Number(item.numberOfMembers) || 1) * (Number(item.barsPerMember) || 1);
    const totalLengthM = Number((totalBars * (Number(item.cutLengthM) || 0)).toFixed(2));
    const weightKg = Number((totalLengthM * (Number(item.unitWeightKgM) || 0)).toFixed(1));
    totalSteelWeightKg += weightKg;
    if (steelWeightByDiameter[item.diameterMm] !== undefined) {
      steelWeightByDiameter[item.diameterMm] += weightKg;
    }
  }

  const totalSteelTonnage = Number((totalSteelWeightKg / 1000).toFixed(2));
  // Prevailing rebar price ~ GMD 85/kg in Gambia
  const estimatedRebarCost = Math.round(totalSteelWeightKg * 85);

  let designFeeAmount = 0;
  if (project.pricingModel === 'rate_per_sqm') {
    designFeeAmount = Math.round((Number(project.totalFloorArea) || 0) * (Number(project.ratePerSqm) || 0));
  } else if (project.pricingModel === 'percentage') {
    designFeeAmount = Math.round(((Number(project.estimatedConstructionCost) || 0) * (Number(project.percentageOfEstCost) || 0)) / 100);
  } else {
    designFeeAmount = Math.round(Number(project.lumpSumAmount) || 0);
  }

  const supervisionFeeAmount = project.supervisionIncluded
    ? Math.round((Number(project.supervisionVisits) || 0) * (Number(project.ratePerSupervisionVisit) || 0))
    : 0;

  const totalEngineeringFee = designFeeAmount + supervisionFeeAmount;

  return {
    totalSteelWeightKg: Math.round(totalSteelWeightKg),
    totalSteelTonnage,
    estimatedRebarCost,
    designFeeAmount,
    supervisionFeeAmount,
    totalEngineeringFee,
    steelWeightByDiameter,
  };
}
