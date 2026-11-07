import type { PdfDocumentMetadata, PdfRulesetScope, StoredPdfDocument } from "./pdfLibrary";

const databaseName = "dnd35-rule-pdf-library";
const databaseVersion = 1;
const documentStoreName = "documents";

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This environment does not support local PDF storage."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(documentStoreName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open the PDF library."));
    request.onblocked = () => reject(new Error("The PDF library database is blocked by another open connection."));
  });
}

function transact<Result>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<Result>,
): Promise<Result> {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(documentStoreName, mode);
    const request = operation(transaction.objectStore(documentStoreName));
    let result: { value: Result } | undefined;
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      database.close();
      reject(error);
    };

    request.onsuccess = () => {
      result = { value: request.result };
    };
    request.onerror = () => fail(request.error ?? new Error("Unable to access the PDF library."));
    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      database.close();
      if (!result) {
        reject(new Error("The PDF library transaction completed without a result."));
        return;
      }
      resolve(result.value);
    };
    transaction.onerror = () => fail(transaction.error ?? new Error("The PDF library transaction failed."));
    transaction.onabort = () => fail(transaction.error ?? new Error("The PDF library transaction was aborted."));
  }));
}

function withoutPdf(document: StoredPdfDocument): PdfDocumentMetadata {
  const { pdf: _pdf, ...metadata } = document;
  return metadata;
}

export async function listPdfDocuments(): Promise<PdfDocumentMetadata[]> {
  const documents = await transact<StoredPdfDocument[]>("readonly", (store) => store.getAll());
  return documents.map(withoutPdf).sort((left, right) => right.addedAt.localeCompare(left.addedAt));
}

export async function savePdfDocument(file: File, scope: PdfRulesetScope): Promise<PdfDocumentMetadata> {
  const document: StoredPdfDocument = {
    id: crypto.randomUUID(),
    name: file.name,
    scope,
    addedAt: new Date().toISOString(),
    size: file.size,
    pdf: file.slice(0, file.size, "application/pdf"),
  };
  await transact("readwrite", (store) => store.put(document));
  return withoutPdf(document);
}

export function loadPdfDocument(id: string): Promise<StoredPdfDocument | undefined> {
  return transact<StoredPdfDocument | undefined>("readonly", (store) => store.get(id));
}

export async function deletePdfDocument(id: string): Promise<void> {
  await transact("readwrite", (store) => store.delete(id));
}
