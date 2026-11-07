import { useEffect, useMemo, useRef, useState } from "react";
import type { RulesetId } from "../domain";
import {
  getApplicablePdfDocuments,
  getPdfScopeForRuleset,
  getPdfScopeLabel,
  isPdfRulesetScope,
  type PdfDocumentMetadata,
  type PdfRulesetScope,
} from "../pdfLibrary";
import {
  deletePdfDocument,
  listPdfDocuments,
  loadPdfDocument,
  savePdfDocument,
} from "../pdfLibraryStorage";
import "./PdfLibrary.css";

interface PdfLibraryProps {
  ruleset: RulesetId;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfLibrary({ ruleset }: PdfLibraryProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<PdfDocumentMetadata[]>([]);
  const [scope, setScope] = useState<PdfRulesetScope>(() => getPdfScopeForRuleset(ruleset));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showOtherRulesets, setShowOtherRulesets] = useState(false);
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [viewer, setViewer] = useState<{ id: string; name: string; url: string }>();

  const visibleDocuments = useMemo(
    () => showOtherRulesets ? documents : getApplicablePdfDocuments(documents, ruleset),
    [documents, ruleset, showOtherRulesets],
  );
  const hiddenDocumentCount = documents.length - visibleDocuments.length;

  useEffect(() => {
    let cancelled = false;
    listPdfDocuments()
      .then((loaded) => {
        if (!cancelled) setDocuments(loaded);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(`Unable to load the PDF library. ${getErrorMessage(loadError)}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!viewer) return;
    return () => URL.revokeObjectURL(viewer.url);
  }, [viewer]);

  const addPdf = async (file: File) => {
    setBusy(true);
    setError(undefined);
    setStatus(undefined);
    try {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        throw new Error("Choose a PDF file.");
      }
      if (file.size === 0 || (await file.slice(0, 5).text()) !== "%PDF-") {
        throw new Error("The selected file is empty or does not have a valid PDF header.");
      }
      const saved = await savePdfDocument(file, scope);
      setDocuments((current) => [saved, ...current]);
      setStatus(`${file.name} was added to this device's PDF library.`);
      if (fileInput.current) fileInput.current.value = "";
    } catch (saveError: unknown) {
      setError(`Unable to add the PDF. ${getErrorMessage(saveError)}`);
    } finally {
      setBusy(false);
    }
  };

  const openPdf = async (document: PdfDocumentMetadata) => {
    setBusy(true);
    setError(undefined);
    setStatus(undefined);
    try {
      const stored = await loadPdfDocument(document.id);
      if (!stored) throw new Error("The PDF is no longer in the local library.");
      setViewer({
        id: stored.id,
        name: stored.name,
        url: URL.createObjectURL(stored.pdf),
      });
    } catch (openError: unknown) {
      setError(`Unable to open ${document.name}. ${getErrorMessage(openError)}`);
    } finally {
      setBusy(false);
    }
  };

  const removePdf = async (document: PdfDocumentMetadata) => {
    if (!window.confirm(`Remove "${document.name}" from this device's PDF library?`)) return;
    setBusy(true);
    setError(undefined);
    setStatus(undefined);
    try {
      await deletePdfDocument(document.id);
      setDocuments((current) => current.filter((entry) => entry.id !== document.id));
      setViewer((current) => current?.id === document.id ? undefined : current);
      setStatus(`${document.name} was removed from this device's PDF library.`);
    } catch (deleteError: unknown) {
      setError(`Unable to remove ${document.name}. ${getErrorMessage(deleteError)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel pdf-library">
      <header className="panel-title">
        <h2>Rules PDF Library</h2>
        <span className="rule-status">Local to this device</span>
      </header>
      <div className="pdf-library-content">
        <p className="pdf-library-notice">
          Add PDFs you have access to. They are stored in this app's local browser profile and are not uploaded or bundled with the app.
          Click inside the PDF, then use the viewer's Find command (Ctrl+F or Command+F) to search within a book.
        </p>
        <div className="pdf-library-import">
          <label>
            PDF file
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf"
              aria-label="PDF file"
              disabled={busy}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void addPdf(file);
              }}
            />
          </label>
          <label>
            Ruleset
            <select
              aria-label="PDF ruleset"
              value={scope}
              disabled={busy}
              onChange={(event) => {
                if (isPdfRulesetScope(event.target.value)) setScope(event.target.value);
              }}
            >
              <option value="all">All rulesets</option>
              <option value="core-35-srd">Core SRD</option>
              <option value="dragonlance-user-pack">Dragonlance</option>
            </select>
          </label>
        </div>
        {error && <p className="pdf-library-error" role="alert">{error}</p>}
        {status && <p className="pdf-library-status" role="status">{status}</p>}
        <div className="pdf-library-list">
          <div className="pdf-library-list-heading">
            <h3>Available for {getPdfScopeLabel(getPdfScopeForRuleset(ruleset))}</h3>
            <span>{visibleDocuments.length} PDF{visibleDocuments.length === 1 ? "" : "s"}</span>
          </div>
          <label className="pdf-library-show-all">
            <input
              type="checkbox"
              checked={showOtherRulesets}
              onChange={(event) => setShowOtherRulesets(event.target.checked)}
            />
            Show other rulesets' PDFs for reference
          </label>
          {showOtherRulesets && (
            <p className="pdf-library-filter-note">
              These references do not change or apply rules to the active character.
            </p>
          )}
          {loading ? (
            <p role="status">Loading saved PDFs...</p>
          ) : visibleDocuments.length ? (
            visibleDocuments.map((document) => (
              <article className="pdf-library-document" key={document.id}>
                <div>
                  <strong>{document.name}</strong>
                  <small>{getPdfScopeLabel(document.scope)} · {formatFileSize(document.size)}</small>
                </div>
                <div className="pdf-library-actions">
                  <button type="button" className="secondary-button" disabled={busy} onClick={() => void openPdf(document)}>
                    View / Search
                  </button>
                  <button type="button" className="secondary-button" disabled={busy} onClick={() => void removePdf(document)}>
                    Remove
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p>No PDFs are saved for this ruleset. Add a book or reference PDF above.</p>
          )}
          {hiddenDocumentCount > 0 && (
            <p className="pdf-library-filter-note">
              {hiddenDocumentCount} PDF{hiddenDocumentCount === 1 ? " is" : "s are"} hidden because {hiddenDocumentCount === 1 ? "it belongs" : "they belong"} to another ruleset.
            </p>
          )}
        </div>
        {viewer && (
          <section className="pdf-library-viewer" aria-label={`PDF viewer: ${viewer.name}`}>
            <div className="pdf-library-viewer-heading">
              <h3>{viewer.name}</h3>
              <a href={viewer.url} download={viewer.name}>Download PDF</a>
            </div>
            <iframe title={`PDF viewer: ${viewer.name}`} src={viewer.url} />
          </section>
        )}
      </div>
    </section>
  );
}
