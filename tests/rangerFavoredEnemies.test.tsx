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

    const subtype = screen.getByRole("textbox", {
      name: "Ranger level 1 associated subtype",
    });
    expect((subtype as HTMLInputElement).value).toBe("lawful");
    fireEvent.change(subtype, { target: { value: "water" } });
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ target: "Outsider", subtype: "water" }),
    ]);
  });
});
