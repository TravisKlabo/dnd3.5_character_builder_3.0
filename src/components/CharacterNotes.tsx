import { useEffect, useRef, useState } from "react";
import { Panel } from "./shared";
import { displayNoteDate } from "../noteDates";

function noteEntries(notes: string) {
  const entries: { date?: string; text: string }[] = [];
  const headings = [...notes.matchAll(/(?:^|\n\n)\[([^\]\n]+)\]\n/g)];
  if (!headings.length) return [{ text: notes }];
  const introduction = notes.slice(0, headings[0].index);
  if (introduction) entries.push({ text: introduction });
  headings.forEach((heading, index) => {
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? notes.length;
    entries.push({ date: heading[1], text: notes.slice(start, end) });
  });
  return entries;
}

export function CharacterNotes({
  notes,
  onAddNote,
}: {
  notes?: string;
  onAddNote: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [handwritten, setHandwritten] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  const close = () => {
    dialogRef.current?.close();
    setOpen(false);
    setText("");
    buttonRef.current?.focus();
  };

  return (
    <Panel title="Character Notes" className={`notes-panel${handwritten ? " notes-handwritten" : ""}`}
      headerActions={
        <button type="button" className="note-style-toggle" role="switch" aria-checked={handwritten}
          onClick={() => setHandwritten((current) => !current)}>
          <span className="note-style-track" aria-hidden="true"><span /></span>
          Handwritten
        </button>
      }>
      <div className="character-notes-content">
        <div className="character-notes">
          {notes ? noteEntries(notes).map((entry, index) => (
            <div className="character-note-entry" key={index}>
              <span className="character-note-date">{entry.date ? displayNoteDate(entry.date) : "Undated"}</span>
              <p className="character-note-text">{entry.text}</p>
            </div>
          )) : <p>No notes recorded.</p>}
        </div>
        <button ref={buttonRef} type="button" className="quiet-button" onClick={() => setOpen(true)}>
          Add Note
        </button>
      </div>
      {open && (
        <dialog ref={dialogRef} className="character-note-dialog" aria-labelledby="character-note-title"
          onCancel={(event) => { event.preventDefault(); close(); }}>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (!text.trim()) return;
            onAddNote(text.trim());
            close();
          }}>
            <h2 id="character-note-title">Add Character Note</h2>
            <p>The entry date will be added automatically when you add the note.</p>
            <label>
              Note
              <textarea autoFocus rows={6} value={text} onChange={(event) => setText(event.target.value)} />
            </label>
            <div className="character-note-actions">
              <button type="button" className="quiet-button" onClick={close}>Cancel</button>
              <button type="submit" className="level-button" disabled={!text.trim()}>Add Note</button>
            </div>
          </form>
        </dialog>
      )}
    </Panel>
  );
}
