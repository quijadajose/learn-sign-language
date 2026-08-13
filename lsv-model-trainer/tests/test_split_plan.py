"""El split estratificado debe ser válido para sklearn en datasets pequeños."""

import math
import unittest

from validation import TEST_SPLIT_RATIO, compute_class_weights, resolve_split_plan


def _labels(counts_per_class: list[int]) -> list[int]:
    labels: list[int] = []
    for class_index, count in enumerate(counts_per_class):
        labels.extend([class_index] * count)
    return labels


class ResolveSplitPlanTests(unittest.TestCase):
    def _assert_sklearn_compatible(self, counts_per_class: list[int]):
        labels = _labels(counts_per_class)
        n_samples = len(labels)
        n_classes = len(counts_per_class)
        plan = resolve_split_plan(labels)

        self.assertGreaterEqual(plan.test_count, 1)
        self.assertLessEqual(plan.test_count, n_samples - 1)
        if plan.stratify:
            # Las dos condiciones que hacen fallar a train_test_split.
            self.assertGreaterEqual(plan.test_count, n_classes)
            self.assertGreaterEqual(n_samples - plan.test_count, n_classes)
        return plan

    def test_datasets_that_used_to_crash(self):
        # 2 señas x 5 grabaciones, 8 señas x 4, 5 señas x 4: con test_size
        # fraccional sklearn lanzaba "test_size should be >= number of classes".
        for counts in ([5, 5], [4] * 8, [4] * 5, [2, 2], [3] * 3):
            with self.subTest(counts=counts):
                plan = self._assert_sklearn_compatible(counts)
                self.assertTrue(plan.stratify)

    def test_keeps_ratio_when_dataset_is_large_enough(self):
        counts = [20, 20, 20]
        plan = self._assert_sklearn_compatible(counts)
        self.assertEqual(plan.test_count, math.ceil(60 * TEST_SPLIT_RATIO))

    def test_singleton_class_disables_stratify(self):
        plan = resolve_split_plan(_labels([1, 5]))
        self.assertFalse(plan.stratify)
        self.assertGreaterEqual(plan.test_count, 1)
        self.assertLessEqual(plan.test_count, 5)

    def test_degenerate_dataset(self):
        self.assertEqual(resolve_split_plan([]).test_count, 0)
        self.assertEqual(resolve_split_plan([0]).test_count, 0)


class ClassWeightTests(unittest.TestCase):
    def test_balanced_dataset_has_uniform_weights(self):
        weights = compute_class_weights(_labels([4, 4]), 2)
        self.assertAlmostEqual(weights[0], 1.0)
        self.assertAlmostEqual(weights[1], 1.0)

    def test_minority_class_weighs_more(self):
        weights = compute_class_weights(_labels([9, 1]), 2)
        self.assertLess(weights[0], 1.0)
        self.assertGreater(weights[1], 1.0)
        self.assertAlmostEqual(weights[0] * 9, weights[1] * 1)

    def test_absent_class_does_not_divide_by_zero(self):
        weights = compute_class_weights([0, 0], 2)
        self.assertEqual(weights[1], 1.0)


if __name__ == "__main__":
    unittest.main()
