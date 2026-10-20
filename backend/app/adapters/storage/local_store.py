import os
import asyncio
from abc import ABC, abstractmethod


class StorageAdapter(ABC):
    @abstractmethod
    async def save_file(self, file_bytes: bytes, storage_key: str) -> str:
        pass

    @abstractmethod
    async def get_file(self, storage_key: str) -> bytes:
        pass


class LocalStorageAdapter(StorageAdapter):
    def __init__(self, base_dir: str = "./storage_uploads"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_file(self, file_bytes: bytes, storage_key: str) -> str:
        dest_path = os.path.join(self.base_dir, storage_key)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._write_sync, dest_path, file_bytes)
        return dest_path

    def _write_sync(self, path: str, data: bytes):
        with open(path, "wb") as f:
            f.write(data)

    async def get_file(self, storage_key: str) -> bytes:
        dest_path = os.path.join(self.base_dir, storage_key)
        if not os.path.exists(dest_path):
            raise FileNotFoundError(f"Object {storage_key} not found in storage.")
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._read_sync, dest_path)

    def _read_sync(self, path: str) -> bytes:
        with open(path, "rb") as f:
            return f.read()


def get_storage_adapter() -> StorageAdapter:
    return LocalStorageAdapter()
