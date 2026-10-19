import os
import tempfile
import unittest
from pathlib import Path

from trackmcp.cli import _read_key, _write_key, main


class CliTests(unittest.TestCase):
    def test_write_key_preserves_other_environment_values(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env"
            path.write_text("SERVICE=demo\nTRACKMCP_KEY=tmcp_old\n", encoding="utf-8")
            _write_key(path, "tmcp_new_key")
            self.assertEqual(_read_key(path), "tmcp_new_key")
            self.assertIn("SERVICE=demo", path.read_text(encoding="utf-8"))

    def test_doctor_is_non_destructive(self):
        previous = os.environ.pop("TRACKMCP_KEY", None)
        try:
            self.assertEqual(main(["doctor"]), 0)
        finally:
            if previous is not None:
                os.environ["TRACKMCP_KEY"] = previous


if __name__ == "__main__":
    unittest.main()
