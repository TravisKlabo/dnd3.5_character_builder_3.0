import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { RangerFavoredEnemies } from "../src/components/RangerFavoredEnemies";

describe("Ranger favored enemies", () => {
  it("allows entering the required Outsider subtype", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 1 }];
    character.rangerFavoredEnemies = [{
      classLevel: 1,
      kind: "creature",
      target: "Outsider",
      subtype: "lawful",
      bonusTargetLevel: 1,
    }];
    const onChange = vi.fn();

    render(
      <RangerFavoredEnemies
        character={character}
        editableLevels={[1]}
        onChange={onChange}
      />,
    );

    const subtype = screen.getByRole<HTMLSelectElement>("combobox", {
      name: "Ranger level 1 associated subtype",
    });
    expect(subtype.value).toBe("lawful");
    expect(screen.getByRole("option", { name: "water" })).toBeDefined();
    expect(screen.queryByRole("option", { name: "demon" })).toBeNull();
    fireEvent.change(subtype, { target: { value: "water" } });
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ target: "Outsider", subtype: "water" }),
    ]);
  });

  it("preserves imported non-PHB subtypes so they can be corrected", () => {
    const character = cloneCharacter(initialCharacter);
    character.classLevels = [{ classId: "ranger", level: 1 }];
    character.rangerFavoredEnemies = [{
      classLevel: 1,
      kind: "creature",
      target: "Humanoid",
      subtype: "homebrew",
      bonusTargetLevel: 1,
    }];

    render(
      <RangerFavoredEnemies
        character={character}
        editableLevels={[1]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("option", { name: "homebrew (not PHB-listed)" })).toBeDefined();
    expect(screen.getByRole("combobox", {
      name: "Ranger level 1 associated subtype",
    }).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Choose a PHB-listed subtype.")).toBeDefined();
  });
});
