import { type StoreItem } from "../data/equipmentCatalog";
import { useState, useRef, useEffect, useMemo } from "react";
import { handleScrollableMenuKeyDown } from "../menuNavigation";
import { getSizedWeaponDamage, getWeaponProfile, getWeaponSizeNote, getStoreItemDescription, getSizedStoreWeight, getSizedStorePrice } from "../rules";
import { createPortal } from "react-dom";
import { type FeatDefinition, classDefinitions, type ClassId } from "../domain";

export function EquipmentItemPicker({
  items,
  size,
  owned,
  onSelect,
  onPurchase,
  bulk = false,
  menuOnLeft = false,
  tooltipOnLeft = false,
}: {
  items: StoreItem[];
  size: string;
  owned: Record<string, number>;
  onSelect: (item: StoreItem) => void;
  onPurchase: (item: StoreItem, quantity?: number) => void;
  bulk?: boolean;
  menuOnLeft?: boolean;
  tooltipOnLeft?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StoreItem>();
  const [quantity, setQuantity] = useState(1);
  const [hovered, setHovered] = useState<StoreItem>();
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>();
  const pickerRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return items.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
  }, [items, query]);
  const purchaseSelected = () => {
    if (!selected) return;
    onPurchase(selected, bulk ? quantity : 1);
    setSelected(undefined);
    setHovered(undefined);
  };
  const chooseItem = (item: StoreItem) => {
    setSelected(item);
    onSelect(item);
    setOpen(false);
    setHovered(undefined);
  };
  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        !(event.target instanceof Element) ||
          (!pickerRef.current?.contains(event.target) &&
            !event.target.closest(".equipment-portal-menu"))
      ) {
        setOpen(false);
        setHovered(undefined);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);
  return (
    <div
      className={`class-field feat-picker equipment-item-picker${menuOnLeft ? " menu-on-left" : ""}${tooltipOnLeft ? " tooltip-on-left" : ""}`}
      ref={pickerRef}
    >
      <button
        className="race-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          setQuery("");
          setHighlightedIndex(0);
          if (nextOpen) {
            const rect = pickerRef.current?.getBoundingClientRect();
            if (rect) {
              setMenuPosition({ top: rect.bottom + 4, left: rect.left });
            }
          }
          setHovered(nextOpen ? results[0] : undefined);
        }}
      >
        {selected?.name ?? "Choose an item..."}
        <span aria-hidden="true">▾</span>
      </button>
      {bulk ? (
        <span className="equipment-quantity-control">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>−</button>
          <span>{quantity}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((current) => current + 1)}>+</button>
          <button className="equipment-purchase-button equipment-cart-button" type="button" disabled={!selected} aria-label={selected ? `Purchase ${quantity} ${selected.name}` : "Choose an item to purchase"} title={selected ? `Purchase ${quantity} ${selected.name}` : "Choose an item first"} onClick={purchaseSelected}><span aria-hidden="true">$+</span></button>
        </span>
      ) : (
        <button className="equipment-purchase-button" type="button" disabled={!selected} aria-label={selected ? `Purchase ${selected.name}` : "Choose an item to purchase"} title={selected ? `Purchase ${selected.name}` : "Choose an item first"} onClick={purchaseSelected}><span aria-hidden="true">$</span></button>
      )}
      {hovered && (
        <span className="feat-picker-tooltip" role="tooltip">
          <strong>{hovered.name}</strong>
          <br />
          {hovered.category === "Weapons"
            ? `${getSizedWeaponDamage(getWeaponProfile(hovered.name).damage, size)} damage; crit ${getWeaponProfile(hovered.name).crit}; ${getWeaponSizeNote(size)}.`
            : hovered.category === "Armor"
              ? getStoreItemDescription(hovered, size)
            : null}
          <br />
          {getSizedStoreWeight(hovered, size)} carried weight;{" "}
          {getSizedStorePrice(hovered, size).toLocaleString()} gp.
          <br />
          {owned[`${hovered.name} (${size})`]
            ? `Owned: ${owned[`${hovered.name} (${size})`]}`
            : "Not owned yet."}
        </span>
      )}
      {open &&
        createPortal(
        <div
          className="race-menu equipment-portal-menu"
          style={
            menuPosition
              ? {
                  position: "fixed",
                  zIndex: 1000,
                  top: menuPosition.top,
                  left: menuPosition.left,
                }
              : undefined
          }
          role="listbox"
          aria-label="Equipment choices"
        >
          <div className="feat-search">
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                const nextResults = items.filter((item) =>
                  item.name.toLowerCase().includes(nextQuery.toLowerCase().trim()),
                );
                setQuery(nextQuery);
                setHighlightedIndex(0);
                setHovered(nextResults[0]);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  const nextIndex = results.length
                    ? (highlightedIndex + 1) % results.length
                    : 0;
                  setHighlightedIndex(nextIndex);
                  setHovered(results[nextIndex]);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  const nextIndex = results.length
                    ? (highlightedIndex - 1 + results.length) % results.length
                    : 0;
                  setHighlightedIndex(nextIndex);
                  setHovered(results[nextIndex]);
                } else if (event.key === "Enter" && results[highlightedIndex]) {
                  event.preventDefault();
                  chooseItem(results[highlightedIndex]);
                } else if (event.key === "Escape") {
                  setOpen(false);
                  setHovered(undefined);
                }
              }}
              placeholder="Search items"
              aria-label="Search equipment"
            />
          </div>
          {results.map((item, index) => (
            <button
              className={`race-option${index === highlightedIndex ? " is-highlighted" : ""}`}
              key={item.name}
              type="button"
              role="option"
              onMouseEnter={() => {
                setHighlightedIndex(index);
                setHovered(item);
              }}
              onFocus={() => {
                setHighlightedIndex(index);
                setHovered(item);
              }}
              onMouseLeave={() => setHovered(undefined)}
              onBlur={() => setHovered(undefined)}
              onClick={() => chooseItem(item)}
            >
              {item.name} — {getSizedStorePrice(item, size).toLocaleString()} gp
              — {getSizedStoreWeight(item, size)}
            </button>
          ))}
          {!results.length && (
            <span className="feat-no-results">No items match.</span>
          )}
        </div>,
          document.body,
        )}
    </div>
  );
}

export function FeatPicker({
  selected,
  options,
  selectedFeat,
  onChange,
}: {
  selected: string;
  options: FeatDefinition[];
  selectedFeat?: FeatDefinition;
  onChange: (featId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOffset, setMenuOffset] = useState(0);
  const [hoveredDescription, setHoveredDescription] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const choices =
    selectedFeat && !options.some((feat) => feat.id === selectedFeat.id)
      ? [selectedFeat, ...options]
      : options;
  const filteredChoices = choices.filter((feat) =>
    feat.name.toLowerCase().includes(query.toLowerCase().trim()),
  );
  useEffect(() => {
    if (!open) return;
    const firstPicker = document.querySelector<HTMLElement>(
      ".feat-choices .feat-picker",
    );
    if (firstPicker && pickerRef.current)
      setMenuOffset(
        firstPicker.getBoundingClientRect().top -
          pickerRef.current.getBoundingClientRect().top,
      );
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        !(event.target instanceof Element) ||
        !pickerRef.current?.contains(event.target)
      ) {
        setOpen(false);
        setHoveredDescription("");
      }
    };
    const closeWhenAnotherPickerOpens = (event: Event) => {
      if (event.target !== pickerRef.current) {
        setOpen(false);
        setHoveredDescription("");
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("feat-picker-open", closeWhenAnotherPickerOpens);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener(
        "feat-picker-open",
        closeWhenAnotherPickerOpens,
      );
    };
  }, [open]);
  return (
    <div className="class-field feat-picker" ref={pickerRef}>
      <button
        className="race-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => {
          if (!open) document.dispatchEvent(new Event("feat-picker-open"));
          setOpen((isOpen) => {
            if (isOpen) setHoveredDescription("");
            return !isOpen;
          });
          setQuery("");
        }}
      >
        {selectedFeat?.name ?? "Choose a feat"}
        <span aria-hidden="true">▾</span>
      </button>
      {hoveredDescription && (
        <span
          className="feat-picker-tooltip"
          role="tooltip"
          style={{ top: `${menuOffset}px` }}
        >
          {hoveredDescription}
        </span>
      )}
      {open && (
        <div
          className="race-menu"
          style={{ top: `${menuOffset}px` }}
          role="listbox"
          aria-label="Feat choices"
          onKeyDown={handleScrollableMenuKeyDown}
        >
          <div className="feat-search">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search feats"
              aria-label="Search feats"
            />
          </div>
          <button
            className="race-option"
            type="button"
            role="option"
            aria-selected={!selected}
            onClick={() => {
              onChange("");
              setOpen(false);
              setHoveredDescription("");
            }}
          >
            <span>Choose a feat</span>
          </button>
          {filteredChoices.map((feat) => (
            <button
              className={`race-option ${feat.id === selected ? "selected" : ""}`}
              key={feat.id}
              type="button"
              role="option"
              aria-selected={feat.id === selected}
              title={feat.description}
              onMouseEnter={() => setHoveredDescription(feat.description)}
              onFocus={() => setHoveredDescription(feat.description)}
              onMouseLeave={() => setHoveredDescription("")}
              onBlur={() => setHoveredDescription("")}
              onClick={() => {
                onChange(feat.id);
                setOpen(false);
                setHoveredDescription("");
              }}
            >
              <span>{feat.name}</span>
            </button>
          ))}
          {!filteredChoices.length && (
            <span className="feat-no-results">No eligible feats match.</span>
          )}
        </div>
      )}
    </div>
  );
}

export function LanguagePicker({
  selected,
  options,
  onChange,
}: {
  selected: string;
  options: string[];
  onChange: (language: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const filteredOptions = options.filter((language) =>
    language.toLowerCase().includes(query.toLowerCase().trim()),
  );
  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        !(event.target instanceof Element) ||
        !pickerRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    const closeWhenAnotherPickerOpens = (event: Event) => {
      if (event.target !== pickerRef.current) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener(
      "language-picker-open",
      closeWhenAnotherPickerOpens,
    );
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener(
        "language-picker-open",
        closeWhenAnotherPickerOpens,
      );
    };
  }, [open]);
  return (
    <div className="class-field language-picker" ref={pickerRef}>
      <button
        className="race-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => {
          if (!open) document.dispatchEvent(new Event("language-picker-open"));
          setOpen((isOpen) => !isOpen);
          setQuery("");
        }}
      >
        {selected || "Choose a language"}
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          className="race-menu"
          role="listbox"
          aria-label="Language choices"
          onKeyDown={handleScrollableMenuKeyDown}
        >
          <div className="feat-search">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search languages"
              aria-label="Search languages"
            />
          </div>
          <button
            className="race-option"
            type="button"
            role="option"
            aria-selected={!selected}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <span>Choose a language</span>
          </button>
          {filteredOptions.map((language) => (
            <button
              className={`race-option ${language === selected ? "selected" : ""}`}
              key={language}
              type="button"
              role="option"
              aria-selected={language === selected}
              onClick={() => {
                onChange(language);
                setOpen(false);
              }}
            >
              <span>{language}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SpellPicker({
  spells,
  selected,
  onChange,
  onOpenChange,
  disabled = false,
  placeholder = "Choose a spell",
}: {
  spells: {
    name: string;
    level: number;
    classes: string[];
    description: string;
  }[];
  selected?: string;
  onChange: (spell: string) => void;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOffset, setMenuOffset] = useState(0);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>();
  const [hoveredSpell, setHoveredSpell] = useState<{
    level: number;
    classes: string[];
    description: string;
  }>();
  const pickerRef = useRef<HTMLDivElement>(null);
  const filteredSpells = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return spells.filter((spell) => spell.name.toLowerCase().includes(normalizedQuery));
  }, [spells, query]);
  const selectedSpell = spells.find((spell) => spell.name === selected);
  useEffect(() => {
    if (!open) return;
    const firstPicker = document.querySelector<HTMLElement>(
      ".spell-levels .spell-picker",
    );
    if (firstPicker && pickerRef.current)
      setMenuOffset(
        firstPicker.getBoundingClientRect().top -
          pickerRef.current.getBoundingClientRect().top,
      );
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        !(event.target instanceof Element) ||
        !pickerRef.current?.contains(event.target)
      ) {
        setOpen(false);
        onOpenChange?.(false);
        setHoveredSpell(undefined);
      }
    };
    const closeWhenAnotherPickerOpens = (event: Event) => {
      if (event.target !== pickerRef.current) {
        setOpen(false);
        onOpenChange?.(false);
        setHoveredSpell(undefined);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("spell-picker-open", closeWhenAnotherPickerOpens);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("spell-picker-open", closeWhenAnotherPickerOpens);
    };
  }, [open, onOpenChange]);
  return (
    <div className="class-field feat-picker spell-picker" ref={pickerRef}>
      <button
        className="race-trigger"
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => {
          if (!open) document.dispatchEvent(new Event("spell-picker-open"));
          setOpen(!open);
          onOpenChange?.(!open);
          setQuery("");
          if (!open) {
            const rect = pickerRef.current?.getBoundingClientRect();
            if (rect)
              setMenuPosition({ top: rect.top, left: rect.right + 18 });
          }
          if (open) setHoveredSpell(undefined);
        }}
      >
        {selectedSpell ? `${selectedSpell.name} (Level ${selectedSpell.level})` : placeholder}
        <span aria-hidden="true">▾</span>
      </button>
      {hoveredSpell && (
        <span
          className="feat-picker-tooltip"
          role="tooltip"
          style={{ top: `${menuOffset}px` }}
        >
          <strong>
            {hoveredSpell.level === 0
              ? "Cantrip"
              : `Level ${hoveredSpell.level}`}{" "}
            ·{" "}
            {hoveredSpell.classes
              .map(
                (classId) =>
                  classDefinitions[classId as ClassId]?.name ?? classId,
              )
              .join(", ")}
          </strong>
          <br />
          {hoveredSpell.description || "No description available."}
        </span>
      )}
      {open && (
        <div
          className="race-menu"
          style={
            menuPosition
              ? {
                  position: "fixed",
                  zIndex: 1000,
                  top: menuPosition.top,
                  left: menuPosition.left,
                }
              : undefined
          }
          role="listbox"
          aria-label="Spell choices"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              onOpenChange?.(false);
              setHoveredSpell(undefined);
              return;
            }
            handleScrollableMenuKeyDown(event);
          }}
        >
          <div className="feat-search">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search spells"
              aria-label="Search spells"
            />
          </div>
          {filteredSpells.map((spell) => (
            <button
              className={`race-option ${selected === spell.name ? "selected" : ""}`}
              key={spell.name}
              type="button"
              role="option"
              aria-selected={selected === spell.name}
              onMouseEnter={() => setHoveredSpell(spell)}
              onFocus={() => setHoveredSpell(spell)}
              onMouseLeave={() => setHoveredSpell(undefined)}
              onBlur={() => setHoveredSpell(undefined)}
              onClick={() => {
                onChange(spell.name);
                setOpen(false);
                onOpenChange?.(false);
                setHoveredSpell(undefined);
              }}
            >
              {spell.name} (Level {spell.level})
            </button>
          ))}
          {!filteredSpells.length && (
            <span className="feat-no-results">No spells match.</span>
          )}
        </div>
      )}
    </div>
  );
}
