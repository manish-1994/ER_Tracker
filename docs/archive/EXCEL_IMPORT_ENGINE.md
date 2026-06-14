# Excel & CSV Ingestion Engine

This document details the parsing algorithms, layout validation, and dynamic column mappings implemented in the ingestion engine.

## Core Features

### 1. Supported File Extensions
- **XLSX / XLS**: Native SheetJS Excel file parser.
- **CSV**: Text parsing fallback via SheetJS.

### 2. First-Row Header Alignment
- The importer automatically parses the first row of any uploaded spreadsheet as the column header array.
- Avoids generic default headings (like `Column A`, `Column B`) when non-empty content is found.

### 3. Blank Header Fallbacks
- If a header row is completely blank, the engine automatically defaults to standard spreadsheet column notation letters (e.g. `Column A`, `Column B`, `Column C`).
- If individual cells in the header are empty (while others are populated), the engine maps them to `Unnamed: 1`, `Unnamed: 2`, etc., allowing administrative renaming later.

### 4. Database Row Ingest Payload Mapping
- Columns are registered in the metadata `columns` database table.
- Row cell entries are extracted and mapped into a key-value payload object, where keys match the sanitized lowercase versions of their column headings.
- If the database lacks a relation table matching the worksheet (e.g. for dynamic newly created worksheets), the engine falls back to storing, editing, and retrieving the rows in browser `localStorage`.
