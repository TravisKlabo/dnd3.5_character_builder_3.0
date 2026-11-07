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
    .replace(/\bConcentration\b(?:\s*,\s*|\s*)/gi, "")
    .replace(/^\s*\(([^()]*)\)/, "$1")
    .replace(/\s{2,}/g, " ")
    .trim()
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

export function spellRequiresConcentration(duration: string) {
  return /\bConcentration\b/i.test(duration);
}

export function formatSpellCastingTime(castingTime: string) {
  return castingTime
    .replace(/\bAt least (\d+)\s+minutes?\b/gi, "$1+ min")
    .replace(/\b(\d+)\s+minutes?\s+or longer\b/gi, "$1 min+")
    .replace(/\bOne minute\b/gi, "1 min")
    .replace(/\b1 standard action\b/gi, "Std. action")
    .replace(/\b1 full[- ]round action\b/gi, "Full-round")
    .replace(/\b1 swift action\b/gi, "Swift")
    .replace(/\b1 immediate action\b/gi, "Immed. action")
    .replace(/\bminutes?\b/gi, "min")
    .replace(/\bhours?\b/gi, "hr")
    .replace(/\brounds?\b/gi, (round, offset, source) => {
      if (source[offset - 1] === "-") return round;
      return round.toLowerCase() === "rounds" ? "rds" : "rd";
    });
}
