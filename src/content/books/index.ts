import type { Book } from "@/types/content";
import { e2eFixtureBooks } from "./fixtures/e2e-books";
import { wakasamaru } from "./wakasamaru";

// Register new books here. Only src/lib/content-repository.ts may import this file.
const realBooks: Book[] = [wakasamaru];

// The Playwright build adds a test-only catalog to prove multi-book behavior (see fixtures/e2e-books.ts).
const includeFixtures = process.env.LEAF_E2E_FIXTURES === "1";

export const allBooks: Book[] = includeFixtures ? [...realBooks, ...e2eFixtureBooks] : realBooks;
