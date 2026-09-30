import type { Book } from "@/types/content";
import { e2eFixtureBooks } from "./fixtures/e2e-books";
import { realBooks } from "./index.generated";

// Books are JSON files in this folder, listed by the generated index (the studio or `npm run content:index` writes it).
// Only src/lib/content-repository.ts may import this file.

// The Playwright build adds a test-only catalog to prove multi-book behavior (see fixtures/e2e-books.ts).
const includeFixtures = process.env.LEAF_E2E_FIXTURES === "1";

export const allBooks: Book[] = includeFixtures ? [...realBooks, ...e2eFixtureBooks] : realBooks;
