export function formatSpellSchool(school?: string) {
  const abbreviations: Record<string, string> = {
    Abjuration: "Abj",
    Conjuration: "Conj",
    Divination: "Div",
    Enchantment: "Ench",
    Evocation: "Evoc",
    Illusion: "Ill",
    Necromancy: "Necro",
    Transmutation: "Trans",
    Universal: "Univ",
  };
  return school ? abbreviations[school] ?? school : "";
}

export function formatSpellDuration(duration: string) {
  return duration
    .replace(/Concentration/gi, "Con")
    .replace(/Permanent/gi, "Perm")
    .replace(/Instantaneous/gi, "Inst")
    .replace(/rounds?/gi, "rds")
    .replace(/minutes?/gi, "min")
    .replace(/hours?/gi, "hr")
    .replace(/days?/gi, "day")
    .replace(/weeks?/gi, "wk")
    .replace(/months?/gi, "mo")
    .replace(/years?/gi, "yr");
}
