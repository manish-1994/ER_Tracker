# Workbook API Phase 1B Report

## Files Modified / Added
- **backend/app/api/rows.py** – new FastAPI router exposing CRUD endpoints for worksheet rows.
- **backend/app/main.py** – includes the new `rows_router`.

## Endpoints
| Method | URL | Description | Response |
|--------|-----|-------------|----------|
| GET | `/api/worksheets/{sheet_id}/rows` | Retrieve all rows for a sheet. | `200` – list of row objects `{id, ...}` |
| POST | `/api/worksheets/{sheet_id}/rows` | Create a new row. Body: `{ "data": { … } }`. | `200` – `{ "id": <new_row_id> }` |
| PUT | `/api/worksheets/{sheet_id}/rows/{row_id}` | Update an existing row. Body: `{ "data": { … } }`. | `200` – `{ "status": "updated" }` |
| DELETE | `/api/worksheets/{sheet_id}/rows/{row_id}` | Delete a row. | `200` – `{ "status": "deleted" }` |

All endpoints depend on the **authenticated user** (`get_current_user`), satisfying the “authenticated users only” requirement.

## Request / Response Examples
```http
GET /api/worksheets/3/rows HTTP/1.1
Authorization: Bearer <jwt>
```
```json
[
  {"id": 1, "Name": "Alice", "Score": "42"},
  {"id": 2, "Name": "Bob", "Score": "37"}
]
```
```http
POST /api/worksheets/3/rows HTTP/1.1
Authorization: Bearer <jwt>
Content-Type: application/json

{ "data": { "Name": "Charlie", "Score": "28" } }
```
```json
{ "id": 3 }
```
```http
PUT /api/worksheets/3/rows/3 HTTP/1.1
Authorization: Bearer <jwt>
Content-Type: application/json

{ "data": { "Score": "30" } }
```
```json
{ "status": "updated" }
```
```http
DELETE /api/worksheets/3/rows/3 HTTP/1.1
Authorization: Bearer <jwt>
```
```json
{ "status": "deleted" }
```

## Error Handling
- **404** – returned when the sheet does not exist or a specific row cannot be found.
- **400** – returned for malformed payloads (missing `data`).
- **500** – any unexpected server error bubbles up as a 500 with the exception message.

## Swagger Verification
The new endpoints appear under the **worksheets** tag in the automatically generated OpenAPI UI:
```
http://localhost:8000/docs
```
(Headers show GET, POST, PUT, DELETE for `/api/worksheets/{sheet_id}/rows`.)

*Screenshot omitted in the markdown; the CI runner can capture the UI if needed.*

## Testing Summary
1. **Upload a workbook** via the existing `/api/upload` endpoint – a sheet and its `records_<uuid>` table were created and the `records_table_name` column populated.
2. **GET rows** – returned an empty list for a fresh sheet.
3. **POST row** – created a row, returned its `id` and persisted it to the correct `records_*` table.
4. **PUT row** – updated the newly created row; subsequent GET reflected the change.
5. **DELETE row** – removed the row; GET confirmed it was gone.
6. **Isolation** – repeated the above steps with a second workbook; each sheet interacted only with its own records table, confirming the mapping works.

All operations completed without errors and the Swagger UI correctly documents the endpoints.

---
*Report generated on 2026‑06‑09.*