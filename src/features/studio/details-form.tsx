import { createBookAction, saveDetailsAction } from "@/app/(studio)/studio/actions";
import type { Book } from "@/types/content";
import { ActionForm } from "./action-form";
import { GenreField, SynopsisField } from "./fields";
import { Card, Code } from "./status";

export const fieldClass = "min-h-11 w-full rounded-control border border-[#cbc7c0] bg-surface px-3 py-2.5 text-sm";

function Field({ id, label, hint, optional, children }: { id: string; label: string; hint?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

const SERIES = [
  ["", "Not set"],
  ["ongoing", "Ongoing"],
  ["complete", "Complete"],
  ["one-shot", "One-shot"],
] as const;

/** Step 1: creates the book JSON from a folder, or edits its details. */
export function DetailsForm({ slug, book, knownGenres }: { slug: string; book: Book | undefined; knownGenres: string[] }) {
  const credits = [...(book?.credits ?? []), { role: "", name: "" }, { role: "", name: "" }];
  return (
    <Card title="Book details" aside={<span className="text-[13px] text-muted">Saves to <Code>src/content/books/{slug}.json</Code></span>}>
      <ActionForm action={book ? saveDetailsAction : createBookAction} submit={book ? "Save details" : "Create book"} className="flex flex-col gap-5">
        <input type="hidden" name="slug" value={slug} />
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="title" label="Title">
            <input id="title" name="title" required defaultValue={book?.title} placeholder="The book's title" className={fieldClass} />
          </Field>
          <Field id="slug-view" label="Slug" hint="From the folder name. It becomes the URL, so it can't change after publishing.">
            <input id="slug-view" value={slug} readOnly className={`${fieldClass} bg-bg text-muted`} />
          </Field>
          <div className="md:col-span-2">
            <Field id="subtitle" label="Subtitle" optional>
              <input id="subtitle" name="subtitle" defaultValue={book?.subtitle} placeholder="A one-line tagline" className={fieldClass} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <SynopsisField defaultValue={book?.synopsis} />
          </div>
          <GenreField defaultValue={book?.genres.join(", ")} known={knownGenres} />
          <Field id="seriesStatus" label="Series status" optional>
            <select id="seriesStatus" name="seriesStatus" defaultValue={book?.seriesStatus ?? ""} className={fieldClass}>
              {SERIES.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </Field>
          <fieldset className="flex flex-col gap-2 md:col-span-2">
            <legend className="mb-1.5 text-[13px] font-semibold">
              Credits <span className="font-normal text-muted">(empty rows are ignored)</span>
            </legend>
            {credits.map((credit, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,200px)_minmax(0,1fr)] gap-2">
                <input aria-label={`Credit ${i + 1} role`} name="creditRole" defaultValue={credit.role} placeholder="Role, e.g. Story & art" className={fieldClass} />
                <input aria-label={`Credit ${i + 1} name`} name="creditName" defaultValue={credit.name} placeholder="Name" className={fieldClass} />
              </div>
            ))}
          </fieldset>
          <div className="grid gap-5 border-t border-border pt-5 md:col-span-2 md:grid-cols-2">
            <Field id="contentNotes" label="Content notes" hint="Separate with commas. Shown on the book page before reading.">
              <input id="contentNotes" name="contentNotes" defaultValue={book?.contentNotes?.join(", ")} placeholder="e.g. Depictions of violence" className={fieldClass} />
            </Field>
            <Field id="artworkDisclosure" label="Artwork disclosure" hint="Required before publishing. Illustrated or AI art must never read as archival imagery.">
              <textarea id="artworkDisclosure" name="artworkDisclosure" rows={2} defaultValue={book?.artworkDisclosure} className={fieldClass} />
            </Field>
            <Field id="sourceNotesUrl" label="Source notes link" optional hint="For historical books: a page listing your sources.">
              <input id="sourceNotesUrl" name="sourceNotesUrl" type="url" defaultValue={book?.sourceNotesUrl} placeholder="https://" className={fieldClass} />
            </Field>
          </div>
        </div>
      </ActionForm>
    </Card>
  );
}
