import json
import sqlite3
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Iterator


class Catalog:
    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connect() as db:
            db.executescript(
                """
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY, title TEXT NOT NULL, kind TEXT NOT NULL,
                    text TEXT NOT NULL, pages_json TEXT NOT NULL, created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS chunk_sets (
                    id TEXT PRIMARY KEY, document_id TEXT NOT NULL,
                    chunk_size INTEGER NOT NULL, chunk_overlap INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS chunks (
                    id TEXT PRIMARY KEY, chunk_set_id TEXT NOT NULL, document_id TEXT NOT NULL,
                    document_title TEXT NOT NULL, page INTEGER NOT NULL,
                    position INTEGER NOT NULL, text TEXT NOT NULL,
                    FOREIGN KEY(chunk_set_id) REFERENCES chunk_sets(id) ON DELETE CASCADE,
                    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS indices (
                    id TEXT PRIMARY KEY, collection_name TEXT UNIQUE NOT NULL,
                    provider TEXT NOT NULL, model TEXT NOT NULL, dimension INTEGER NOT NULL,
                    chunk_size INTEGER NOT NULL, chunk_overlap INTEGER NOT NULL,
                    distance_metric TEXT NOT NULL, document_ids_json TEXT NOT NULL,
                    chunk_count INTEGER NOT NULL, embedding_sample_json TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )

    @staticmethod
    def now() -> str:
        return datetime.now(UTC).isoformat()

    def create_document(self, item: dict[str, Any]) -> None:
        with self.connect() as db:
            db.execute(
                "INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?)",
                (item["id"], item["title"], item["kind"], item["text"],
                 json.dumps(item["pages"], ensure_ascii=False), item["created_at"]),
            )

    def list_documents(self) -> list[dict[str, Any]]:
        with self.connect() as db:
            rows = db.execute("SELECT * FROM documents ORDER BY created_at DESC").fetchall()
        return [self._document(row) for row in rows]

    def get_document(self, document_id: str) -> dict[str, Any] | None:
        with self.connect() as db:
            row = db.execute("SELECT * FROM documents WHERE id = ?", (document_id,)).fetchone()
        return self._document(row) if row else None

    @staticmethod
    def _document(row: sqlite3.Row) -> dict[str, Any]:
        item = dict(row)
        item["pages"] = json.loads(item.pop("pages_json"))
        return item

    def create_chunk_set(self, item: dict[str, Any], chunks: list[dict[str, Any]]) -> None:
        with self.connect() as db:
            db.execute(
                "INSERT INTO chunk_sets VALUES (?, ?, ?, ?, ?)",
                (item["id"], item["document_id"], item["chunk_size"],
                 item["chunk_overlap"], item["created_at"]),
            )
            db.executemany(
                "INSERT INTO chunks VALUES (?, ?, ?, ?, ?, ?, ?)",
                [(c["id"], item["id"], c["document_id"], c["document_title"],
                  c["page"], c["position"], c["text"]) for c in chunks],
            )

    def get_chunk_set(self, chunk_set_id: str) -> dict[str, Any] | None:
        with self.connect() as db:
            row = db.execute("SELECT * FROM chunk_sets WHERE id = ?", (chunk_set_id,)).fetchone()
            if not row:
                return None
            chunks = db.execute(
                "SELECT id, document_id, document_title, page, position, text "
                "FROM chunks WHERE chunk_set_id = ? ORDER BY position", (chunk_set_id,)
            ).fetchall()
        item = dict(row)
        item["chunks"] = [dict(chunk) for chunk in chunks]
        return item

    def delete_chunk_sets_for_document(self, document_id: str) -> None:
        """Replace the editable chunking draft without modifying persisted indices."""
        with self.connect() as db:
            db.execute("DELETE FROM chunk_sets WHERE document_id = ?", (document_id,))

    def create_index(self, item: dict[str, Any]) -> None:
        with self.connect() as db:
            db.execute(
                "INSERT INTO indices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (item["id"], item["collection_name"], item["provider"], item["model"],
                 item["dimension"], item["chunk_size"], item["chunk_overlap"],
                 item["distance_metric"], json.dumps(item["document_ids"]),
                 item["chunk_count"], json.dumps(item["embedding_sample"]), item["created_at"]),
            )

    def list_indices(self) -> list[dict[str, Any]]:
        with self.connect() as db:
            rows = db.execute("SELECT * FROM indices ORDER BY created_at DESC").fetchall()
        return [self._index(row) for row in rows]

    def get_index(self, index_id: str) -> dict[str, Any] | None:
        with self.connect() as db:
            row = db.execute("SELECT * FROM indices WHERE id = ?", (index_id,)).fetchone()
        return self._index(row) if row else None

    @staticmethod
    def _index(row: sqlite3.Row) -> dict[str, Any]:
        item = dict(row)
        item["document_ids"] = json.loads(item.pop("document_ids_json"))
        item["embedding_sample"] = json.loads(item.pop("embedding_sample_json"))
        return item

    def delete_document(self, document_id: str) -> bool:
        with self.connect() as db:
            cursor = db.execute("DELETE FROM documents WHERE id = ?", (document_id,))
        return cursor.rowcount > 0

    def delete_index(self, index_id: str) -> bool:
        with self.connect() as db:
            cursor = db.execute("DELETE FROM indices WHERE id = ?", (index_id,))
        return cursor.rowcount > 0

    def clear_library(self) -> None:
        with self.connect() as db:
            db.execute("DELETE FROM indices")
            db.execute("DELETE FROM documents")

    def update_index_contents(
        self, index_id: str, document_ids: list[str], chunk_count: int
    ) -> None:
        with self.connect() as db:
            db.execute(
                "UPDATE indices SET document_ids_json = ?, chunk_count = ? WHERE id = ?",
                (json.dumps(document_ids), chunk_count, index_id),
            )
