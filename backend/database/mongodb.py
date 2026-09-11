"""
REVENANT MongoDB Atlas Client
Handles persistence of ML vessel detection analyses and query endpoints.
Reads connection string from environment variable MONGODB_URI.
"""

import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

# Load root and backend .env
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

MONGODB_URI = os.getenv("MONGODB_URI", "")
DB_NAME = "coastal_surveillance"

class MongoDBManager:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(MongoDBManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, '_initialized', False):
            return

        self.client: Optional[MongoClient] = None
        self.db = None
        self.analyses_collection = None
        self._connect()
        self._initialized = True

    def _connect(self):
        uri = MONGODB_URI
        if not uri:
            print("[MONGO WARNING] No MONGODB_URI found in environment. Running in offline/standby mode.")
            return

        try:
            self.client = MongoClient(uri, serverSelectionTimeoutMS=5000)
            # Verify connection
            self.client.admin.command('ping')
            self.db = self.client[DB_NAME]
            self.analyses_collection = self.db['analyses']
            # Create index on analysis_id and timestamp
            self.analyses_collection.create_index([("analysis_id", 1)], unique=True)
            self.analyses_collection.create_index([("timestamp", -1)])
            print(f"[MONGO CONNECTED] Connected successfully to MongoDB Atlas database: {DB_NAME}")
        except Exception as e:
            print(f"[MONGO WARNING] Could not connect to MongoDB Atlas ({e}). Offline fallback active.")
            self.client = None
            self.db = None
            self.analyses_collection = None

    def is_connected(self) -> bool:
        return self.analyses_collection is not None

    def insert_analysis(self, record: Dict[str, Any]) -> bool:
        """
        Inserts an analysis record into MongoDB Atlas analyses collection.
        """
        if self.analyses_collection is None:
            print(f"[MONGO STANDBY] Simulated save for analysis: {record.get('analysis_id')}")
            return False

        try:
            record_copy = dict(record)
            if "created_at" not in record_copy:
                record_copy["created_at"] = datetime.now(timezone.utc)
            self.analyses_collection.insert_one(record_copy)
            print(f"[MONGO SAVE] Persisted analysis {record.get('analysis_id')} to MongoDB Atlas.")
            return True
        except Exception as e:
            print(f"[MONGO ERROR] Failed to persist analysis to Atlas: {e}")
            return False

    def get_recent_analyses(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Retrieves recent analysis runs from MongoDB Atlas.
        """
        if self.analyses_collection is None:
            return []

        try:
            cursor = self.analyses_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
            return list(cursor)
        except Exception as e:
            print(f"[MONGO ERROR] Failed to fetch analyses from Atlas: {e}")
            return []

# Singleton instance
db_manager = MongoDBManager()
