import type { Book } from "@/types/content";
import { wakasamaru } from "./wakasamaru";

// Register new books here. Only src/lib/content-repository.ts may import this file.
export const allBooks: Book[] = [wakasamaru];
