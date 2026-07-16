import unittest
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import sync_bazi, sync_divination
from app.db import get_connection
from app.schemas.bazi import BaziChartDetail
from app.schemas.divination_records import DivinationRecordSyncRequest
from app.services.divination_records import upsert_divination_record


class FakeConnection:
    def __init__(self) -> None:
        self.last_query = ""
        self.last_args: tuple[object, ...] = ()

    async def execute(self, query: str, *args: object) -> str:
        return "OK"

    async def fetchrow(self, query: str, *args: object) -> dict[str, object]:
        self.last_query = query
        self.last_args = args
        return {
            "id": "server-record-id",
            "updatedAt": datetime(2026, 7, 16, tzinfo=UTC),
            "created": False,
        }


def create_test_client(connection: FakeConnection) -> TestClient:
    app = FastAPI()
    app.include_router(sync_divination.router, prefix="/api")

    async def override_connection():
        yield connection

    app.dependency_overrides[get_connection] = override_connection
    return TestClient(app)


def request_body() -> dict[str, object]:
    return {
        "localId": "local-record-1",
        "question": "测试占事",
        "summary": "测试排盘",
        "detail": "测试详情",
        "payload": {"chart": {"value": 1}},
        "createdAt": "2026-07-16T12:00:00+08:00",
    }


class SyncDivinationRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = FakeConnection()
        self.client = create_test_client(self.connection)

    def test_all_supported_types_sync_successfully(self) -> None:
        session = {"user": {"id": "user-1"}}
        synced_at = datetime(2026, 7, 16, tzinfo=UTC)
        self.client.cookies.set("sm1_session", "session-token")

        with (
            patch.object(sync_divination, "get_user_by_session_token", new=AsyncMock(return_value=session)),
            patch.object(
                sync_divination,
                "upsert_divination_record",
                new=AsyncMock(return_value=("server-record-id", synced_at, True)),
            ),
        ):
            for record_type in ("liuyao", "qimen", "ziwei", "daliuren"):
                with self.subTest(record_type=record_type):
                    response = self.client.post(
                        f"/api/sync/{record_type}",
                        json=request_body(),
                    )
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.json()["serverId"], "server-record-id")

    def test_sync_requires_login(self) -> None:
        with patch.object(sync_divination, "get_user_by_session_token", new=AsyncMock(return_value=None)):
            response = self.client.post("/api/sync/qimen", json=request_body())

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "请先登录后再同步排盘记录")

    def test_unsupported_type_is_rejected(self) -> None:
        response = self.client.post("/api/sync/tarot", json=request_body())
        self.assertEqual(response.status_code, 422)


class SyncBaziRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        app = FastAPI()
        app.include_router(sync_bazi.router, prefix="/api")

        async def override_connection():
            yield FakeConnection()

        app.dependency_overrides[get_connection] = override_connection
        self.client = TestClient(app)
        self.body = {
            "localId": "local-bazi-1",
            "name": "测试",
            "gender": "male",
            "birthTime": "2000-01-01T12:00",
            "calendar": "solar",
            "location": "北京市",
            "useSolarTime": False,
            "chartJson": {"columns": []},
        }

    def test_bazi_sync_success(self) -> None:
        chart = BaziChartDetail(
            id="bazi-server-id",
            profileId="profile-id",
            name="测试",
            gender="male",
            birthTime="2000-01-01T12:00",
            calendar="solar",
            location="北京市",
            useSolarTime=False,
            pillars="",
            createdAt="2026-07-16T00:00:00+00:00",
            updatedAt="2026-07-16T00:00:00+00:00",
            chartJson={"columns": []},
        )
        with (
            patch.object(sync_bazi, "get_user_by_session_token", new=AsyncMock(return_value={"user": {"id": "user-1"}})),
            patch.object(
                sync_bazi,
                "create_or_update_local_bazi_chart",
                new=AsyncMock(return_value=(chart, True)),
            ),
        ):
            response = self.client.post("/api/sync/bazi", json=self.body)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["serverId"], "bazi-server-id")

    def test_bazi_sync_requires_login(self) -> None:
        with patch.object(sync_bazi, "get_user_by_session_token", new=AsyncMock(return_value=None)):
            response = self.client.post("/api/sync/bazi", json=self.body)

        self.assertEqual(response.status_code, 401)


class DivinationRecordServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_upsert_uses_user_type_and_local_id_as_idempotency_key(self) -> None:
        connection = FakeConnection()
        body = DivinationRecordSyncRequest.model_validate(request_body())

        server_id, _, created = await upsert_divination_record(connection, "user-1", "qimen", body)

        self.assertEqual(server_id, "server-record-id")
        self.assertFalse(created)
        self.assertIn('ON CONFLICT ("userId", type, "localId")', connection.last_query)
        self.assertEqual(connection.last_args[1:4], ("user-1", "qimen", "local-record-1"))


if __name__ == "__main__":
    unittest.main()
