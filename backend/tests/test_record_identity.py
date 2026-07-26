import json
import unittest
from pathlib import Path

from app.services.record_identity import build_record_identity


VECTORS_PATH = Path(__file__).resolve().parents[2] / "docs" / "contracts" / "record-identity-v1-vectors.json"


class RecordIdentityTests(unittest.TestCase):
    def test_cross_language_vectors(self) -> None:
        vectors = json.loads(VECTORS_PATH.read_text(encoding="utf-8"))

        for vector in vectors:
            with self.subTest(vector=vector["name"]):
                result = build_record_identity(vector["input"])
                self.assertEqual(result["canonical"], vector["expectedCanonical"])
                self.assertEqual(result["recordKey"], vector["expectedRecordKey"])

    def test_different_liuyao_occurrences_do_not_merge(self) -> None:
        base = {
            "type": "liuyao",
            "question": "合作能否成功",
            "completedAt": "2026-07-26T10:05:30Z",
            "castingMethod": "shake",
            "lineTotals": [7, 8, 9, 6, 7, 8],
        }

        first = build_record_identity(base)
        second = build_record_identity({**base, "completedAt": "2026-07-26T10:06:30Z"})

        self.assertNotEqual(first["recordKey"], second["recordKey"])


if __name__ == "__main__":
    unittest.main()
