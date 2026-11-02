export function getWizardCopyRequirements(level: number) {
  if (!Number.isInteger(level) || level < 0 || level > 9) throw new Error("Wizard spell level must be 0 through 9.");
  const pages = Math.max(1, level);
  return { decipherDC: 20 + level, learningDC: 15 + level, studyHours: 8, pages,
    writingCostGp: pages * 100, writingHours: 24, usualAccessFeeGp: level * 50 };
}
