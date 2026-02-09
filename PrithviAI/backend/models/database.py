"""
PrithviAI — Database Module (Zero-Cost JSON File Storage)
Replaces MongoDB with a lightweight JSON file-based store.
No external database required — data persists to local JSON files.
"""

import json
import os
from datetime import datetime, date
from typing import Any, Optional
from config import settings

_data_dir: str = None
_collections: dict = {}


class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for datetime objects."""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


class JSONCollection:
    """
    Lightweight collection-like interface backed by a JSON file.
    Provides basic CRUD operations similar to MongoDB.
    """

    def __init__(self, name: str, data_dir: str):
        self.name = name
        self.filepath = os.path.join(data_dir, f"{name}.json")
        self._data = []
        self._load()

    def _load(self):
        """Load data from JSON file."""
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
            except (json.JSONDecodeError, IOError):
                self._data = []
        else:
            self._data = []

    def _save(self):
        """Persist data to JSON file."""
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self._data, f, cls=JSONEncoder, indent=2)
        except IOError as e:
            print(f"[DB] Error saving {self.name}: {e}")

    async def insert_one(self, document: dict) -> dict:
        """Insert a single document."""
        doc = {**document, "_id": str(len(self._data) + 1)}
        self._data.append(doc)
        self._save()
        return doc

    async def find(self, query: dict = None, limit: int = 100) -> list:
        """Find documents matching query (basic key-value matching)."""
        if not query:
            return self._data[-limit:]
        results = []
        for doc in self._data:
            if all(doc.get(k) == v for k, v in query.items()):
                results.append(doc)
                if len(results) >= limit:
                    break
        return results

    async def find_one(self, query: dict) -> Optional[dict]:
        """Find a single document."""
        for doc in self._data:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    async def count_documents(self, query: dict = None) -> int:
        """Count documents matching query."""
        if not query:
            return len(self._data)
        return len([d for d in self._data if all(d.get(k) == v for k, v in query.items())])

    async def create_index(self, keys):
        """No-op — JSON storage doesn't need indexes."""
        pass


async def connect_db():
    """Initialize JSON file storage."""
    global _data_dir, _collections

    _data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), settings.DATA_DIR)
    os.makedirs(_data_dir, exist_ok=True)

    # Pre-create common collections
    for name in ["environmental_data", "risk_assessments", "chat_sessions"]:
        _collections[name] = JSONCollection(name, _data_dir)

    print(f"[DB] JSON file storage initialized at: {_data_dir}")
    return _collections


async def disconnect_db():
    """Cleanup — save all pending data."""
    for col in _collections.values():
        col._save()
    print("[DB] JSON file storage closed")


def get_db():
    """Get database reference (dict of collections)."""
    return _collections


def get_collection(name: str) -> JSONCollection:
    """Get or create a named collection."""
    global _collections
    if name not in _collections and _data_dir:
        _collections[name] = JSONCollection(name, _data_dir)
    return _collections.get(name)
