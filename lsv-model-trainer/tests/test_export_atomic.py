"""Export TFJS: shards desde el manifest, hashes y reemplazo atómico de carpeta."""

import hashlib
import json
import os
import tempfile
import unittest
from unittest import mock

from tfjs_export import replace_directory, sha256_file, weight_shard_paths


def _write_model_json(directory: str, paths: list) -> str:
    path = os.path.join(directory, "model.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"modelTopology": {}, "weightsManifest": [{"paths": paths, "weights": []}]}, f)
    return path


class WeightShardPathsTests(unittest.TestCase):
    def test_ignores_stale_shards_on_disk(self):
        with tempfile.TemporaryDirectory() as tmp:
            model_json = _write_model_json(tmp, ["group1-shard1of1.bin"])
            for name in ("group1-shard1of1.bin", "group1-shard1of2.bin", "group1-shard2of2.bin"):
                open(os.path.join(tmp, name), "wb").close()
            self.assertEqual(weight_shard_paths(model_json), ["group1-shard1of1.bin"])

    def test_rejects_paths_outside_model_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            for bad in ("../x.bin", "sub/x.bin", "", ".."):
                model_json = _write_model_json(tmp, [bad])
                with self.assertRaises(ValueError):
                    weight_shard_paths(model_json)

    def test_requires_at_least_one_shard(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(RuntimeError):
                weight_shard_paths(_write_model_json(tmp, []))


class Sha256FileTests(unittest.TestCase):
    def test_matches_hashlib(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "w.bin")
            data = os.urandom(3 * 1024 * 1024 + 7)
            with open(path, "wb") as f:
                f.write(data)
            self.assertEqual(sha256_file(path), hashlib.sha256(data).hexdigest())


class ReplaceDirectoryTests(unittest.TestCase):
    def _make(self, root, name, files):
        path = os.path.join(root, name)
        os.makedirs(path)
        for file_name in files:
            with open(os.path.join(path, file_name), "w") as f:
                f.write(name)
        return path

    def test_replaces_existing_directory_without_leftovers(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = self._make(tmp, "model", ["model.json", "group1-shard1of2.bin", "group1-shard2of2.bin"])
            staging = self._make(tmp, "staging", ["model.json", "group1-shard1of1.bin"])
            replace_directory(staging, target)
            self.assertEqual(sorted(os.listdir(target)), ["group1-shard1of1.bin", "model.json"])
            self.assertEqual(sorted(os.listdir(tmp)), ["model"])

    def test_creates_target_when_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            staging = self._make(tmp, "staging", ["model.json"])
            target = os.path.join(tmp, "model")
            replace_directory(staging, target)
            self.assertTrue(os.path.isfile(os.path.join(target, "model.json")))

    def test_restores_previous_model_if_swap_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = self._make(tmp, "model", ["model.json"])
            staging = self._make(tmp, "staging", ["model.json"])
            real_rename = os.rename
            calls = {"n": 0}

            def flaky_rename(src, dst):
                calls["n"] += 1
                if calls["n"] == 2:
                    raise OSError("disk full")
                return real_rename(src, dst)

            with mock.patch("tfjs_export.os.rename", side_effect=flaky_rename):
                with self.assertRaises(OSError):
                    replace_directory(staging, target)
            with open(os.path.join(target, "model.json")) as f:
                self.assertEqual(f.read(), "model")


if __name__ == "__main__":
    unittest.main()
