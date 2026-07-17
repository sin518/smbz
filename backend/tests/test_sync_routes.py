import unittest
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import bazi, sync_bazi, sync_divination
from app.db import get_connection
from app.schemas.bazi import BaziChartDetail, BaziCloudChart
from app.schemas.divination_records import DivinationRecordCloudItem, DivinationRecordSyncRequest
from app.services.divination_records import delete_divination_record, list_divination_records, upsert_divination_record


class FakeConnection:
    def __init__(self) -> None:
        self.last_query = ""
        self.last_args: tuple[object, ...] = ()
        self.rows: list[dict[str, object]] = []
        self.execute_result = "OK"

    async def execute(self, query: str, *args: object) -> str:
        self.last_query = query
        self.last_args = args
        return self.execute_result

    async def fetch(self, query: str, *args: object) -> list[dict[str, object]]:
        self.last_query = query
        self.last_args = args
        return self.rows

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

    def test_cloud_records_can_be_listed_and_deleted(self) -> None:
        session = {"user": {"id": "user-1"}}
        item = DivinationRecordCloudItem(
            id="server-record-id",
            localId="local-record-1",
            type="liuyao",
            question="测试占事",
            summary="六爻断事",
            detail="摇卦",
            payload={"chart": {}},
            createdAt="2026-07-16T00:00:00+00:00",
            updatedAt="2026-07-16T00:00:00+00:00",
        )
        with (
            patch.object(sync_divination, "get_user_by_session_token", new=AsyncMock(return_value=session)),
            patch.object(sync_divination, "list_divination_records", new=AsyncMock(return_value=[item])),
            patch.object(sync_divination, "delete_divination_record", new=AsyncMock(return_value=True)),
        ):
            list_response = self.client.get("/api/sync/records")
            delete_response = self.client.delete("/api/sync/records/server-record-id")

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.json()["records"][0]["localId"], "local-record-1")
        self.assertEqual(delete_response.status_code, 200)

    def test_cloud_records_require_login(self) -> None:
        with patch.object(sync_divination, "get_user_by_session_token", new=AsyncMock(return_value=None)):
            response = self.client.get("/api/sync/records")

        self.assertEqual(response.status_code, 401)

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
            chartJson={"columns": []},
            createdAt="2026-07-16T00:00:00+00:00",
            updatedAt="2026-07-16T00:00:00+00:00",
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


class CloudBaziRouteTests(unittest.TestCase):
    def test_cloud_bazi_list_includes_local_id_without_chart_payload(self) -> None:
        app = FastAPI()
        app.include_router(bazi.router, prefix="/api/bazi")

        async def override_connection():
            yield FakeConnection()

        app.dependency_overrides[get_connection] = override_connection
        chart = BaziCloudChart(
            id="bazi-server-id",
            profileId="profile-id",
            localId="local-bazi-1",
            name="测试",
            gender="male",
            birthTime="2000-01-01T12:00",
            calendar="solar",
            location="北京市",
            useSolarTime=False,
            pillars="甲子",
            createdAt="2026-07-16T00:00:00+00:00",
            updatedAt="2026-07-16T00:00:00+00:00",
            chartJson={"columns": []},
        )
        with (
            patch.object(bazi, "require_user_id", new=AsyncMock(return_value="user-1")),
            patch.object(bazi, "list_bazi_charts", new=AsyncMock(return_value=[chart])),
        ):
            response = TestClient(app).get("/api/bazi/charts")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["charts"][0]["localId"], "local-bazi-1")
        self.assertNotIn("chartJson", response.json()["charts"][0])


class DivinationRecordServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_upsert_uses_user_type_and_local_id_as_idempotency_key(self) -> None:
        connection = FakeConnection()
        body = DivinationRecordSyncRequest.model_validate(request_body())

        server_id, _, created = await upsert_divination_record(connection, "user-1", "qimen", body)

        self.assertEqual(server_id, "server-record-id")
        self.assertFalse(created)
        self.assertIn('ON CONFLICT ("userId", type, "localId")', connection.last_query)
        self.assertEqual(connection.last_args[1:4], ("user-1", "qimen", "local-record-1"))

    async def test_cloud_queries_are_scoped_to_current_user(self) -> None:
        connection = FakeConnection()
        connection.rows = [
            {
                "id": "server-record-id",
                "localId": "local-record-1",
                "type": "qimen",
                "question": "测试占事",
                "summary": "奇门遁甲",
                "detail": "测试详情",
                "payload": {"chart": {}},
                "occurredAt": datetime(2026, 7, 16, tzinfo=UTC),
                "updatedAt": datetime(2026, 7, 16, tzinfo=UTC),
            }
        ]

        records = await list_divination_records(connection, "user-1")

        self.assertEqual(records[0].id, "server-record-id")
        self.assertIn('WHERE "userId" = $1', connection.last_query)
        self.assertEqual(connection.last_args, ("user-1",))

        connection.execute_result = "DELETE 1"
        deleted = await delete_divination_record(connection, "user-1", "server-record-id")
        self.assertTrue(deleted)
        self.assertIn('id = $1 AND "userId" = $2', connection.last_query)
        self.assertEqual(connection.last_args, ("server-record-id", "user-1"))


if __name__ == "__main__":
    unittest.main()
