import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cloneCharacter, initialCharacter } from "../src/domain";
import { ForgePanel } from "../src/components/ForgePanel";

function renderForge() {
  const onInventoryChange = vi.fn();
  render(
    <ForgePanel
      character={cloneCharacter(initialCharacter)}
      onInventoryChange={onInventoryChange}
    />,
  );
  return onInventoryChange;
}

describe("Forge pricing and restrictions", () => {
  it("includes masterwork costs once for weapons, armor, and shields", () => {
    renderForge();

    expect(screen.getByText("Total price: 2,315 gp")).toBeDefined();
    expect(screen.getByText("Total price: 1,250 gp")).toBeDefined();
    expect(screen.getByText("Total price: 1,170 gp")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Base weapon"), {
      target: { value: "Masterwork Longsword" },
    });
    fireEvent.change(screen.getByLabelText("Base armor"), {
      target: { value: "Masterwork Chain Shirt" },
    });
    fireEvent.change(screen.getByLabelText("Base shield"), {
      target: { value: "Masterwork Heavy Steel Shield" },
    });

    expect(screen.getByText("Total price: 2,315 gp")).toBeDefined();
    expect(screen.getByText("Total price: 1,250 gp")).toBeDefined();
    expect(screen.getByText("Total price: 1,170 gp")).toBeDefined();
  });

  it("adds the cold iron magical surcharge and prices material weapons correctly", () => {
    renderForge();
    fireEvent.change(screen.getByLabelText("Base weapon"), {
      target: { value: "Cold Iron Longsword" },
    });
    expect(screen.getByText("Cold iron magical enhancement: +2,000 gp")).toBeDefined();
    expect(screen.getByText("Total price: 4,330 gp")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Base weapon"), {
      target: { value: "Mithral Longsword" },
    });
    expect(screen.getByText("Total price: 4,015 gp")).toBeDefined();
  });

  it("offers Keen only for piercing or slashing weapons and clears it when switching to an ineligible weapon", () => {
    renderForge();
    const weaponProperty = screen.getAllByLabelText<HTMLSelectElement>("Add special property")[0];
    expect([...weaponProperty.options].some((option) => option.value === "Keen")).toBe(true);

    fireEvent.change(weaponProperty, { target: { value: "Keen" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Keen property" }));
    fireEvent.change(screen.getByLabelText("Base weapon"), {
      target: { value: "Heavy Mace" },
    });

    expect(screen.queryByText(/Keen \+1 Heavy Mace/)).toBeNull();
    expect([...screen.getAllByLabelText<HTMLSelectElement>("Add special property")[0].options]
      .some((option) => option.value === "Keen")).toBe(false);
  });

  it("offers Bashing only for bashable shields and caps shield bonuses at +10", () => {
    renderForge();
    const shield = screen.getByLabelText<HTMLSelectElement>("Base shield");
    const shieldProperty = screen.getAllByLabelText<HTMLSelectElement>("Add special property")[2];
    expect([...shieldProperty.options].some((option) => option.value === "Bashing")).toBe(true);

    fireEvent.change(shieldProperty, { target: { value: "Bashing" } });
    fireEvent.click(screen.getByRole("button", { name: "Add shield property" }));
    fireEvent.change(shield, { target: { value: "Tower Shield" } });

    expect(screen.queryByText(/Bashing \+1 Tower Shield/)).toBeNull();
    expect([...screen.getAllByLabelText<HTMLSelectElement>("Add special property")[2].options]
      .some((option) => option.value === "Bashing")).toBe(false);

    fireEvent.change(shield, { target: { value: "Heavy Steel Shield" } });
    fireEvent.change(screen.getAllByLabelText<HTMLSelectElement>("Enhancement bonus")[2], {
      target: { value: "5" },
    });
    for (const name of ["Arrow Catching", "Bashing", "Blinding", "Animated"]) {
      fireEvent.change(screen.getAllByLabelText<HTMLSelectElement>("Add special property")[2], {
        target: { value: name },
      });
      fireEvent.click(screen.getByRole("button", { name: "Add shield property" }));
    }

    expect(screen.getByText("Total price: 100,170 gp")).toBeDefined();
  });
});
