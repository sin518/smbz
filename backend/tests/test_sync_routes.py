import unittest
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import bazi, sync_bazi, sync_divination
from app.db import get_connection
from app.schemas.bazi import BaziChartDetail, BaziChartInput, BaziCloudChart
from app.schemas.divination_records import DivinationRecordCloudItem, DivinationRecordSyncRequest
from app.services.bazi import create_or_update_local_bazi_chart, delete_bazi_charts
from app.services.divination_records import (
    DivinationSyncOutcome,
    delete_divination_record,
    delete_divination_records,
    get_divination_record,
    list_divination_records,
    upsert_divination_record,
)
from app.services.record_identity import RecordLifecycleConflictError


class FakeConnection:
    def __init__(self) -> None:
        self.last_query = ""
        self.last_args: tuple[object, ...] = ()
        self.rows: list[dict[str, object]] = []
        self.execute_result = "OK"
        self.query_calls: list[tuple[str, tuple[object, ...]]] = []
        self.fetchrow_results: list[dict[str, object] | None] = []

    async def execute(self, query: str, *args: object) -> str:
        self.last_query = query
        self.last_args = args
        self.query_calls.append((query, args))
        return self.execute_result

    async def fetch(self, query: str, *args: object) -> list[dict[str, object]]:
        self.last_query = query
        self.last_args = args
        self.query_calls.append((query, args))
        return self.rows

    async def fetchrow(self, query: str, *args: object) -> dict[str, object] | None:
        self.last_query = query
        self.last_args = args
        self.query_calls.append((query, args))
        if self.fetchrow_results:
            return self.fetchrow_results.pop(0)
        return {
            "id": "server-record-id",
            "updatedAt": datetime(2026, 7, 16, tzinfo=UTC),
            "created": False,
        }

    def transaction(self):
        return FakeTransaction()


class FakeTransaction:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback) -> None:
        return None


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
                new=AsyncMock(
                    return_value=DivinationSyncOutcome(
                        server_id="server-record-id",
                        synced_at=synced_at,
                        created=True,
                        record_key="qimen:v1:test",
                        identity_version=1,
                        calculation_version=1,
                        lifecycle_version=1,
                    )
                ),
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
            patch.object(sync_divination, "get_divination_record", new=AsyncMock(return_value=item)),
            patch.object(sync_divination, "delete_divination_record", new=AsyncMock(return_value=True)),
        ):
            list_response = self.client.get("/api/sync/records")
            detail_response = self.client.get("/api/sync/records/server-record-id")
            delete_response = self.client.delete("/api/sync/records/server-record-id")

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.json()["records"][0]["localId"], "local-record-1")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()["payload"], {"chart": {}})
        self.assertEqual(delete_response.status_code, 200)

    def test_cloud_records_require_login(self) -> None:
        with patch.object(sync_divination, "get_user_by_session_token", new=AsyncMock(return_value=None)):
            response = self.client.get("/api/sync/records")

        self.assertEqual(response.status_code, 401)

    def test_cloud_records_can_be_bulk_deleted(self) -> None:
        self.connection.rows = [{"id": "record-1"}, {"id": "record-2"}]
        session = {"user": {"id": "user-1"}}

        with patch.object(sync_divination, "get_user_by_session_token", new=AsyncMock(return_value=session)):
            response = self.client.request(
                "DELETE",
                "/api/sync/records",
                json={"ids": ["record-1", "record-2", "record-missing"]},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "deletedIds": ["record-1", "record-2"],
                "missingIds": ["record-missing"],
            },
        )

    def test_bulk_delete_requires_login_and_non_empty_ids(self) -> None:
        with patch.object(sync_divination, "get_user_by_session_token", new=AsyncMock(return_value=None)):
            unauthorized = self.client.request(
                "DELETE",
                "/api/sync/records",
                json={"ids": ["record-1"]},
            )

        empty = self.client.request("DELETE", "/api/sync/records", json={"ids": []})
        self.assertEqual(unauthorized.status_code, 401)
        self.assertEqual(empty.status_code, 422)

    def test_unsupported_type_is_rejected(self) -> None:
        response = self.client.post("/api/sync/tarot", json=request_body())
        self.assertEqual(response.status_code, 422)

    def test_client_record_key_mismatch_is_rejected(self) -> None:
        self.client.cookies.set("sm1_session", "session-token")
        body = request_body()
        body["recordKey"] = "qimen:v1:wrong"
        with patch.object(
            sync_divination,
            "get_user_by_session_token",
            new=AsyncMock(return_value={"user": {"id": "user-1"}}),
        ):
            response = self.client.post("/api/sync/qimen", json=body)

        self.assertEqual(response.status_code, 422)
        self.assertIn("recordKey", response.json()["detail"])


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

    def test_cloud_bazi_records_can_be_bulk_deleted(self) -> None:
        app = FastAPI()
        app.include_router(bazi.router, prefix="/api/bazi")
        connection = FakeConnection()
        connection.rows = [{"id": "bazi-1", "profileId": "profile-1"}]

        async def override_connection():
            yield connection

        app.dependency_overrides[get_connection] = override_connection
        with patch.object(bazi, "require_user_id", new=AsyncMock(return_value="user-1")):
            response = TestClient(app).request(
                "DELETE",
                "/api/bazi/charts",
                json={"ids": ["bazi-1", "bazi-missing"]},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"deletedIds": ["bazi-1"], "missingIds": ["bazi-missing"]},
        )

    def test_cloud_bazi_bulk_delete_requires_login(self) -> None:
        app = FastAPI()
        app.include_router(bazi.router, prefix="/api/bazi")

        async def override_connection():
            yield FakeConnection()

        app.dependency_overrides[get_connection] = override_connection
        with patch.object(bazi, "get_user_by_session_token", new=AsyncMock(return_value=None)):
            response = TestClient(app).request(
                "DELETE",
                "/api/bazi/charts",
                json={"ids": ["bazi-1"]},
            )

        self.assertEqual(response.status_code, 401)


class BaziServiceTests(unittest.IsolatedAsyncioTestCase):
    def bazi_body(self) -> BaziChartInput:
        return BaziChartInput(
            name="测试",
            gender="male",
            birthTime="2000-01-01T12:00",
            calendar="solar",
            location="北京市",
            useSolarTime=False,
            chartJson={"columns": []},
        )

    async def test_same_record_key_updates_existing_bazi_across_local_ids(self) -> None:
        connection = FakeConnection()
        connection.fetchrow_results = [
            {
                "id": "bazi-server-id",
                "profileId": "profile-id",
                "chartJson": {"columns": []},
                "name": "测试",
                "gender": "male",
                "birthTime": "2000-01-01T12:00",
                "calendar": "solar",
                "location": "北京市",
                "longitude": None,
                "latitude": None,
                "useSolarTime": False,
                "recordKey": "bazi:v1:stable",
                "identityVersion": 1,
                "calculationVersion": 1,
                "lifecycleVersion": 1,
                "deletedAt": None,
                "createdAt": datetime(2026, 7, 16, tzinfo=UTC),
                "updatedAt": datetime(2026, 7, 16, tzinfo=UTC),
            },
            {
                "id": "bazi-server-id",
                "profileId": "profile-id",
                "chartJson": {"columns": []},
                "createdAt": datetime(2026, 7, 16, tzinfo=UTC),
                "updatedAt": datetime(2026, 7, 17, tzinfo=UTC),
            },
        ]

        chart, created = await create_or_update_local_bazi_chart(
            connection,
            "user-1",
            "device-b-local-id",
            self.bazi_body(),
            record_key="bazi:v1:stable",
            identity_version=1,
            calculation_version=1,
            lifecycle_version=1,
            submission_mode="background",
        )

        self.assertFalse(created)
        self.assertEqual(chart.id, "bazi-server-id")
        lookup_query, lookup_args = next(
            (query, args)
            for query, args in connection.query_calls
            if 'FROM "BaziChart" c' in query and 'p."recordKey" = $2' in query
        )
        self.assertEqual(lookup_args, ("user-1", "bazi:v1:stable", "device-b-local-id"))
        self.assertIn('p."userId" = $1', lookup_query)

    async def test_deleted_bazi_rejects_background_resurrection(self) -> None:
        connection = FakeConnection()
        connection.fetchrow_results = [None, {"profileId": "profile-id", "chartId": "chart-id", "lifecycleVersion": 2}]

        with self.assertRaisesRegex(RecordLifecycleConflictError, "不能自动恢复"):
            await create_or_update_local_bazi_chart(
                connection,
                "user-1",
                "local-bazi-1",
                self.bazi_body(),
                record_key="bazi:v1:stable",
                identity_version=1,
                calculation_version=1,
                lifecycle_version=1,
                submission_mode="background",
            )

    async def test_bulk_delete_is_scoped_to_current_user_and_creates_tombstones(self) -> None:
        connection = FakeConnection()
        connection.rows = [
            {"id": "bazi-1"},
            {"id": "bazi-2"},
        ]

        deleted_ids, missing_ids = await delete_bazi_charts(
            connection,
            "user-1",
            ["bazi-1", "bazi-2", "bazi-missing"],
        )

        self.assertEqual(deleted_ids, ["bazi-1", "bazi-2"])
        self.assertEqual(missing_ids, ["bazi-missing"])
        select_query, select_args = next(
            (query, args)
            for query, args in connection.query_calls
            if "SELECT c.id" in query
        )
        self.assertIn('p."userId" = $1', select_query)
        self.assertIn('c.id = ANY($2::text[])', select_query)
        self.assertEqual(select_args, ("user-1", ["bazi-1", "bazi-2", "bazi-missing"]))
        update_query, update_args = next(
            (query, args)
            for query, args in connection.query_calls
            if 'UPDATE "BaziProfile"' in query
        )
        self.assertIn('"deletedAt" = NOW()', update_query)
        self.assertIn('"lifecycleVersion" = "lifecycleVersion" + 1', update_query)
        self.assertEqual(update_args, (["bazi-1", "bazi-2"], "user-1"))


class DivinationRecordServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_upsert_uses_stable_record_key_across_local_ids(self) -> None:
        connection = FakeConnection()
        connection.fetchrow_results = [
            {
                "id": "server-record-id",
                "updatedAt": datetime(2026, 7, 16, tzinfo=UTC),
                "calculationVersion": 1,
                "lifecycleVersion": 1,
            },
            {
                "id": "server-record-id",
                "updatedAt": datetime(2026, 7, 17, tzinfo=UTC),
                "calculationVersion": 1,
                "lifecycleVersion": 1,
            },
        ]
        body = DivinationRecordSyncRequest.model_validate(request_body())

        outcome = await upsert_divination_record(
            connection,
            "user-1",
            "qimen",
            body,
            record_key="qimen:v1:stable",
            identity_version=1,
        )

        self.assertEqual(outcome.server_id, "server-record-id")
        self.assertFalse(outcome.created)
        lookup_query, lookup_args = connection.query_calls[0]
        self.assertIn('"recordKey" = $3', lookup_query)
        self.assertEqual(lookup_args, ("user-1", "qimen", "qimen:v1:stable", "local-record-1"))
        self.assertIn('UPDATE "DivinationRecord"', connection.last_query)

    async def test_deleted_record_rejects_background_resurrection(self) -> None:
        connection = FakeConnection()
        connection.fetchrow_results = [None, {"lifecycleVersion": 2}]
        body = DivinationRecordSyncRequest.model_validate(request_body())

        with self.assertRaisesRegex(RecordLifecycleConflictError, "不能自动恢复"):
            await upsert_divination_record(
                connection,
                "user-1",
                "qimen",
                body,
                record_key="qimen:v1:stable",
                identity_version=1,
            )

    async def test_explicit_recreation_starts_new_lifecycle(self) -> None:
        connection = FakeConnection()
        connection.fetchrow_results = [
            None,
            {"id": "deleted-server-record-id", "lifecycleVersion": 2},
            {
                "id": "deleted-server-record-id",
                "updatedAt": datetime(2026, 7, 18, tzinfo=UTC),
                "calculationVersion": 1,
                "lifecycleVersion": 3,
            },
        ]
        body = DivinationRecordSyncRequest.model_validate(
            {**request_body(), "submissionMode": "explicit", "lifecycleVersion": 1}
        )

        outcome = await upsert_divination_record(
            connection,
            "user-1",
            "qimen",
            body,
            record_key="qimen:v1:stable",
            identity_version=1,
        )

        self.assertTrue(outcome.created)
        self.assertEqual(outcome.lifecycle_version, 3)
        self.assertIn('"deletedAt" = NULL', connection.last_query)

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
                "recordKey": "qimen:v1:stable",
                "identityVersion": 1,
                "calculationVersion": 1,
                "lifecycleVersion": 1,
                "deletedAt": None,
            }
        ]

        records = await list_divination_records(connection, "user-1")

        self.assertEqual(records[0].id, "server-record-id")
        self.assertIn('WHERE "userId" = $1', connection.last_query)
        self.assertEqual(connection.last_args, ("user-1",))

        connection.fetchrow_results = [{"id": "server-record-id"}]
        deleted = await delete_divination_record(connection, "user-1", "server-record-id")
        self.assertTrue(deleted)
        self.assertIn('id = $1 AND "userId" = $2', connection.last_query)
        self.assertIn('"deletedAt" = NOW()', connection.last_query)
        self.assertEqual(connection.last_args, ("server-record-id", "user-1"))

    async def test_cloud_detail_is_scoped_and_returns_full_payload(self) -> None:
        connection = FakeConnection()
        connection.fetchrow_results = [
            {
                "id": "server-record-id",
                "localId": "local-record-1",
                "type": "qimen",
                "question": "测试占事",
                "summary": "奇门遁甲",
                "detail": "测试详情",
                "payload": {"chart": {"full": True}},
                "occurredAt": datetime(2026, 7, 16, tzinfo=UTC),
                "updatedAt": datetime(2026, 7, 16, tzinfo=UTC),
                "recordKey": "qimen:v1:stable",
                "identityVersion": 1,
                "calculationVersion": 1,
                "lifecycleVersion": 1,
                "deletedAt": None,
            }
        ]

        record = await get_divination_record(connection, "user-1", "server-record-id")

        self.assertEqual(record.payload, {"chart": {"full": True}})
        self.assertIn('id = $1 AND "userId" = $2', connection.last_query)
        self.assertEqual(connection.last_args, ("server-record-id", "user-1"))

    async def test_bulk_delete_is_scoped_to_current_user_and_reports_missing_ids(self) -> None:
        connection = FakeConnection()
        connection.rows = [{"id": "record-1"}, {"id": "record-2"}]

        deleted_ids, missing_ids = await delete_divination_records(
            connection,
            "user-1",
            ["record-1", "record-2", "record-missing"],
        )

        self.assertEqual(deleted_ids, ["record-1", "record-2"])
        self.assertEqual(missing_ids, ["record-missing"])
        self.assertIn('"userId" = $1', connection.last_query)
        self.assertIn('id = ANY($2::text[])', connection.last_query)
        self.assertEqual(connection.last_args, ("user-1", ["record-1", "record-2", "record-missing"]))


if __name__ == "__main__":
    unittest.main()
