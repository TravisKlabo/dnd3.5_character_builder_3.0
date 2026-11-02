import { createContext, useContext, useState, type ReactNode } from "react";
import { type CombatTargetType } from "./domain";
import { type CombatTargetDefenseContext } from "./rules";

export type CombatTargetContext = {
  damageReduction: string;
  defense: CombatTargetDefenseContext;
  targetTypes: CombatTargetType[];
};

type CombatTargetContextValue = {
  value: CombatTargetContext;
  onChange: (value: CombatTargetContext) => void;
};

const CombatTargetContextState = createContext<CombatTargetContextValue | undefined>(undefined);

export function CombatTargetContextProvider({ children }: { children: ReactNode }) {
  const [value, onChange] = useState<CombatTargetContext>({
    damageReduction: "",
    defense: { cover: "none", concealment: "none" },
    targetTypes: [],
  });
  return (
    <CombatTargetContextState.Provider value={{ value, onChange }}>
      {children}
    </CombatTargetContextState.Provider>
  );
}

// eslint-disable-next-line react/only-export-components
export function useCombatTargetContext() {
  const context = useContext(CombatTargetContextState);
  if (!context) throw new Error("CombatTargetContextProvider is required.");
  return context;
}
