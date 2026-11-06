"""Pipeline dynamic-v4 y augmentación sobre la secuencia recortada."""

import unittest

import numpy as np

from utils import (
    DYNAMIC_FEATURES_COUNT,
    MODEL_HAND_FEATURE_START,
    STATIC_FEATURES_COUNT,
    build_dynamic_sequence,
    frame_dropout_sequence,
    frame_to_dynamic,
    resample_sequence,
    sequence_to_dynamic,
    time_warp_sequence,
)


def _linear_gesture(frames: int) -> np.ndarray:
    """Movimiento lineal: el mismo gesto, muestreado con más o menos frames."""
    t = np.linspace(0.0, 1.0, frames)[:, np.newaxis]
    start = np.random.default_rng(0).normal(size=(1, STATIC_FEATURES_COUNT))
    direction = np.random.default_rng(1).normal(size=(1, STATIC_FEATURES_COUNT))
    return start + t * direction


def _reference_resample(sequence: np.ndarray, target: int) -> np.ndarray:
    source = len(sequence)
    out = []
    for i in range(target):
        raw = i * (source - 1) / (target - 1)
        low, high = int(np.floor(raw)), int(np.ceil(raw))
        out.append(sequence[low] + (raw - low) * (sequence[high] - sequence[low]))
    return np.array(out)


class DynamicV4Tests(unittest.TestCase):
    def test_deltas_do_not_depend_on_capture_fps(self):
        """El motivo de dynamic-v4: 15 fps y 30 fps del mismo gesto, mismo vector."""
        slow = build_dynamic_sequence(_linear_gesture(15), 30)
        fast = build_dynamic_sequence(_linear_gesture(45), 30)
        np.testing.assert_allclose(slow, fast, atol=1e-9)

    def test_output_shape(self):
        out = build_dynamic_sequence(_linear_gesture(7), 30)
        self.assertEqual(out.shape, (30, DYNAMIC_FEATURES_COUNT))

    def test_vectorized_sequence_to_dynamic_matches_frame_by_frame(self):
        seq = np.random.default_rng(2).normal(size=(9, STATIC_FEATURES_COUNT))
        expected = np.array(
            [frame_to_dynamic(seq[i], seq[i - 1] if i else None) for i in range(len(seq))]
        )
        np.testing.assert_allclose(sequence_to_dynamic(seq), expected, atol=0)

    def test_vectorized_resample_matches_reference(self):
        seq = np.random.default_rng(3).normal(size=(13, 8))
        for target in (2, 5, 13, 30, 47):
            np.testing.assert_allclose(
                resample_sequence(seq, target), _reference_resample(seq, target), atol=1e-12
            )


class TimeWarpTests(unittest.TestCase):
    def test_keeps_endpoints_and_length(self):
        np.random.seed(0)
        seq = _linear_gesture(20)
        warped = time_warp_sequence(seq)
        self.assertEqual(warped.shape, seq.shape)
        np.testing.assert_allclose(warped[0], seq[0], atol=1e-12)
        np.testing.assert_allclose(warped[-1], seq[-1], atol=1e-12)

    def test_is_monotonic_and_not_uniform(self):
        """Sobre un gesto lineal, el avance debe ser monótono pero con ritmo variable."""
        np.random.seed(4)
        seq = _linear_gesture(40)
        warped = time_warp_sequence(seq)
        # Progreso a lo largo de la dirección del gesto, en [0, 1].
        progress = (warped[:, 0] - seq[0, 0]) / (seq[-1, 0] - seq[0, 0])
        steps = np.diff(progress)
        self.assertTrue(np.all(steps >= -1e-12))
        self.assertGreater(steps.max() / max(steps.min(), 1e-12), 1.05)

    def test_survives_resample_to_fixed_length(self):
        """Un warp uniforme desaparecería tras el resample; este no."""
        np.random.seed(5)
        seq = _linear_gesture(30)
        base = build_dynamic_sequence(seq, 30)
        warped = build_dynamic_sequence(time_warp_sequence(seq), 30)
        self.assertGreater(np.abs(base - warped).max(), 1e-3)


class FrameDropoutTests(unittest.TestCase):
    def test_frozen_frame_has_zero_delta_after_derivation(self):
        np.random.seed(0)
        seq = _linear_gesture(30)
        dropped = frame_dropout_sequence(seq, drop_prob=0.5)
        frozen = [i for i in range(1, len(seq)) if np.array_equal(dropped[i], dropped[i - 1])]
        self.assertTrue(frozen)
        dynamic = sequence_to_dynamic(dropped)
        for i in frozen:
            self.assertTrue(np.all(dynamic[i, STATIC_FEATURES_COUNT:] == 0.0))

    def test_first_frame_drop_zeroes_hands(self):
        np.random.seed(0)
        seq = _linear_gesture(3)
        dropped = frame_dropout_sequence(seq, drop_prob=1.0)
        self.assertTrue(np.all(dropped[0, MODEL_HAND_FEATURE_START:] == 0.0))


if __name__ == "__main__":
    unittest.main()
