import unittest

import numpy as np

from utils import (
    DYNAMIC_FEATURES_COUNT,
    FEATURES_COUNT,
    HAND_BLOCK_SIZE,
    HAND_FEATURE_START,
    HAND_FEATURES,
    MODEL_HAND_FEATURE_START,
    MODEL_POSE_LANDMARKS,
    POSE_LANDMARKS,
    POSE_MIRROR_PAIRS,
    POSE_VELOCITY_FEATURES,
    STATIC_FEATURES_COUNT,
    VELOCITY_POSE_LANDMARKS,
    augmentable_mask,
    frame_to_dynamic,
    mirror_frame_258,
    normalize_pose_scale,
    pose_scale_factor,
    resample_sequence,
    select_pose_landmarks,
    sequence_to_dynamic,
)

MODEL_POSE_LANDMARK_COUNT = len(MODEL_POSE_LANDMARKS)


def _fake_frame(seed: float = 0.0) -> np.ndarray:
    return np.linspace(seed, seed + 1, FEATURES_COUNT, dtype=np.float64)


def _hand_deltas() -> slice:
    """Bloque de velocidad de manos dentro del vector 340D."""
    return slice(STATIC_FEATURES_COUNT, STATIC_FEATURES_COUNT + HAND_FEATURES)


def _pose_deltas() -> slice:
    """Bloque de velocidad de codos y muñecas: los últimos 12 valores."""
    return slice(STATIC_FEATURES_COUNT + HAND_FEATURES, DYNAMIC_FEATURES_COUNT)


def _identifiable_frame() -> np.ndarray:
    """Frame donde cada valor codifica su landmark y su canal."""
    frame = np.zeros(FEATURES_COUNT, dtype=np.float64)
    for landmark in range(POSE_LANDMARKS):
        base = landmark * 4
        frame[base] = landmark + 0.1        # x
        frame[base + 1] = landmark + 0.2    # y
        frame[base + 2] = landmark + 0.3    # z
        frame[base + 3] = landmark / 100.0  # visibility
    frame[HAND_FEATURE_START:] = np.arange(1, HAND_BLOCK_SIZE * 2 + 1) / 10.0
    return frame


def _identifiable_model_frame() -> np.ndarray:
    """El mismo frame, ya recortado al layout que ven los modelos."""
    return select_pose_landmarks(_identifiable_frame())


class ResampleSequenceTests(unittest.TestCase):
    def test_empty(self):
        out = resample_sequence(np.empty((0, FEATURES_COUNT)), 30)
        self.assertEqual(out.shape[0], 0)

    def test_single_frame_tiles(self):
        frame = _fake_frame(0.5)
        out = resample_sequence(np.array([frame]), 5)
        self.assertEqual(out.shape, (5, FEATURES_COUNT))
        np.testing.assert_allclose(out[0], frame)
        np.testing.assert_allclose(out[-1], frame)

    def test_identity_length(self):
        seq = np.array([_fake_frame(i) for i in range(4)])
        out = resample_sequence(seq, 4)
        np.testing.assert_allclose(out, seq)

    def test_interpolate_endpoints(self):
        a = np.zeros(FEATURES_COUNT)
        b = np.ones(FEATURES_COUNT)
        out = resample_sequence(np.array([a, b]), 3)
        self.assertEqual(out.shape, (3, FEATURES_COUNT))
        np.testing.assert_allclose(out[0], a)
        np.testing.assert_allclose(out[-1], b)
        np.testing.assert_allclose(out[1], np.full(FEATURES_COUNT, 0.5))


class SelectPoseLandmarksTests(unittest.TestCase):
    def test_produces_declared_static_count(self):
        out = select_pose_landmarks(_fake_frame())
        self.assertEqual(out.shape, (STATIC_FEATURES_COUNT,))

    def test_keeps_contract_landmarks_in_order(self):
        frame = _identifiable_frame()
        out = select_pose_landmarks(frame)
        for slot, landmark in enumerate(MODEL_POSE_LANDMARKS):
            with self.subTest(landmark=landmark):
                np.testing.assert_allclose(
                    out[slot * 4 : slot * 4 + 4],
                    frame[landmark * 4 : landmark * 4 + 4],
                )

    def test_drops_legs_and_pose_hand_duplicates(self):
        """Piernas y los puntos de mano gruesos del pose no llegan al modelo."""
        dropped = set(range(POSE_LANDMARKS)) - set(MODEL_POSE_LANDMARKS)
        self.assertEqual(dropped, {17, 18, 19, 20, 21, 22, *range(25, 33)})

    def test_hand_blocks_pass_through_intact(self):
        frame = _identifiable_frame()
        out = select_pose_landmarks(frame)
        np.testing.assert_allclose(
            out[MODEL_HAND_FEATURE_START:], frame[HAND_FEATURE_START:]
        )

    def test_accepts_sequences(self):
        seq = np.array([_fake_frame(0.0), _fake_frame(1.0)])
        out = select_pose_landmarks(seq)
        self.assertEqual(out.shape, (2, STATIC_FEATURES_COUNT))
        np.testing.assert_allclose(out[0], select_pose_landmarks(seq[0]))


class DynamicFeaturesTests(unittest.TestCase):
    def test_frame_to_dynamic_shape_and_zero_delta(self):
        frame = select_pose_landmarks(_fake_frame(1.0))
        out = frame_to_dynamic(frame)
        self.assertEqual(out.shape, (DYNAMIC_FEATURES_COUNT,))
        np.testing.assert_allclose(out[:STATIC_FEATURES_COUNT], frame)
        np.testing.assert_allclose(out[STATIC_FEATURES_COUNT:], 0.0)

    def test_sequence_deltas(self):
        f0 = _fake_frame(0.0)
        f1 = f0.copy()
        f1[HAND_FEATURE_START:] += 0.25
        seq = sequence_to_dynamic(select_pose_landmarks(np.array([f0, f1])))
        self.assertEqual(seq.shape, (2, DYNAMIC_FEATURES_COUNT))
        np.testing.assert_allclose(seq[0, STATIC_FEATURES_COUNT:], 0.0)
        np.testing.assert_allclose(seq[1, _hand_deltas()], 0.25)
        # El pose no se movió, así que la velocidad de brazos queda en cero.
        np.testing.assert_allclose(seq[1, _pose_deltas()], 0.0)

    def test_arm_translation_only_shows_in_pose_deltas(self):
        """El motivo del bump a dynamic-v3.

        Trasladar el brazo con la mano en forma fija no mueve un solo valor de
        los bloques de mano, porque llegan relativos a la muñeca. Sin los deltas
        de pose el vector no distingue este frame de uno en reposo.

        Los índices se mueven sobre el frame de 258D, así que esto también
        comprueba que el recorte los remapea al slot correcto.
        """
        f0 = _fake_frame(0.0)
        f1 = f0.copy()
        for landmark in VELOCITY_POSE_LANDMARKS:
            f1[landmark * 4] += 0.2

        seq = sequence_to_dynamic(select_pose_landmarks(np.array([f0, f1])))
        np.testing.assert_allclose(seq[1, _hand_deltas()], 0.0)

        pose_deltas = seq[1, _pose_deltas()].reshape(-1, 3)
        np.testing.assert_allclose(pose_deltas[:, 0], 0.2)
        np.testing.assert_allclose(pose_deltas[:, 1:], 0.0)

    def test_dropped_landmark_movement_is_invisible(self):
        """Mover una pierna no cambia nada del vector que ve el modelo."""
        f0 = _fake_frame(0.0)
        f1 = f0.copy()
        for landmark in range(25, POSE_LANDMARKS):
            f1[landmark * 4 : landmark * 4 + 4] += 0.5

        seq = sequence_to_dynamic(select_pose_landmarks(np.array([f0, f1])))
        baseline = sequence_to_dynamic(select_pose_landmarks(np.array([f0, f0])))
        np.testing.assert_allclose(seq, baseline)

    def test_layout_matches_declared_count(self):
        self.assertEqual(
            STATIC_FEATURES_COUNT + HAND_FEATURES + POSE_VELOCITY_FEATURES,
            DYNAMIC_FEATURES_COUNT,
        )
        self.assertEqual(POSE_VELOCITY_FEATURES, len(VELOCITY_POSE_LANDMARKS) * 3)
        self.assertEqual(
            STATIC_FEATURES_COUNT,
            MODEL_POSE_LANDMARK_COUNT * 4 + HAND_FEATURES,
        )


class PoseScaleTests(unittest.TestCase):
    @staticmethod
    def _frame(half_width: float, pose_value: float = 1.0) -> np.ndarray:
        """Pose con hombros simétricos, como los entrega el frontend ya centrado."""
        frame = np.zeros(FEATURES_COUNT, dtype=np.float64)
        for landmark in range(POSE_LANDMARKS):
            base = landmark * 4
            frame[base] = pose_value
            frame[base + 1] = pose_value * 2
            frame[base + 2] = pose_value * 3
            frame[base + 3] = 0.5
        for landmark, sign in ((11, 1.0), (12, -1.0)):
            base = landmark * 4
            frame[base] = sign * half_width
            frame[base + 1] = 0.0
            frame[base + 2] = 0.0
        frame[HAND_FEATURE_START:] = 0.7
        return frame

    def test_scale_factor_is_shoulder_distance(self):
        self.assertAlmostEqual(float(pose_scale_factor(self._frame(0.25))), 0.5)

    def test_divides_pose_xyz(self):
        normalized = normalize_pose_scale(self._frame(0.25, pose_value=1.0))
        # Escala 0.5, así que el xyz del pose se duplica.
        self.assertAlmostEqual(normalized[0], 2.0)
        self.assertAlmostEqual(normalized[1], 4.0)
        self.assertAlmostEqual(normalized[2], 6.0)

    def test_leaves_visibility_and_hands_untouched(self):
        frame = self._frame(0.25)
        normalized = normalize_pose_scale(frame)
        visibility = np.arange(POSE_LANDMARKS) * 4 + 3
        np.testing.assert_allclose(normalized[visibility], frame[visibility])
        np.testing.assert_allclose(
            normalized[HAND_FEATURE_START:], frame[HAND_FEATURE_START:]
        )

    def test_is_invariant_to_camera_distance(self):
        """Dos capturas del mismo gesto a distinta distancia normalizan igual."""
        near = self._frame(0.25, pose_value=1.0)
        far = near.copy()
        xyz = [
            landmark * 4 + axis
            for landmark in range(POSE_LANDMARKS)
            for axis in range(3)
        ]
        far[xyz] *= 0.4  # la persona se aleja: todo el pose se encoge igual
        np.testing.assert_allclose(
            normalize_pose_scale(near), normalize_pose_scale(far)
        )

    def test_falls_back_when_pose_is_absent(self):
        """Sin pose el bloque llega en cero: dividir por cero daría NaN."""
        frame = np.zeros(FEATURES_COUNT, dtype=np.float64)
        frame[HAND_FEATURE_START:] = 0.7
        self.assertAlmostEqual(float(pose_scale_factor(frame)), 1.0)
        np.testing.assert_allclose(normalize_pose_scale(frame), frame)

    def test_accepts_sequences(self):
        seq = np.array([self._frame(0.25), self._frame(0.125)])
        normalized = normalize_pose_scale(seq)
        self.assertEqual(normalized.shape, seq.shape)
        # Escalas 0.5 y 0.25: el mismo valor de pose se duplica y se cuadruplica.
        self.assertAlmostEqual(normalized[0, 0], 2.0)
        self.assertAlmostEqual(normalized[1, 0], 4.0)

    def test_does_not_mutate_input(self):
        frame = self._frame(0.25)
        original = frame.copy()
        normalize_pose_scale(frame)
        np.testing.assert_allclose(frame, original)


class MirrorTests(unittest.TestCase):
    def test_swaps_hands_and_negates_x(self):
        frame = np.arange(FEATURES_COUNT, dtype=np.float64)
        mirrored = mirror_frame_258(frame)
        # Pose landmark 0 X negated
        self.assertAlmostEqual(mirrored[0], -frame[0])
        lh = frame[HAND_FEATURE_START : HAND_FEATURE_START + 63].copy()
        rh = frame[HAND_FEATURE_START + 63 : HAND_FEATURE_START + 126].copy()
        for hand in (lh, rh):
            for i in range(21):
                hand[i * 3] *= -1.0
        np.testing.assert_allclose(mirrored[HAND_FEATURE_START : HAND_FEATURE_START + 63], rh)
        np.testing.assert_allclose(
            mirrored[HAND_FEATURE_START + 63 : HAND_FEATURE_START + 126], lh
        )

    def test_swaps_symmetric_pose_landmarks(self):
        frame = _identifiable_frame()
        mirrored = mirror_frame_258(frame)

        for left, right in POSE_MIRROR_PAIRS:
            with self.subTest(pair=(left, right)):
                # El landmark izquierdo pasa a ocupar el slot del derecho.
                self.assertAlmostEqual(mirrored[left * 4], -frame[right * 4])
                self.assertAlmostEqual(mirrored[left * 4 + 1], frame[right * 4 + 1])
                self.assertAlmostEqual(mirrored[left * 4 + 2], frame[right * 4 + 2])
                self.assertAlmostEqual(mirrored[left * 4 + 3], frame[right * 4 + 3])
                self.assertAlmostEqual(mirrored[right * 4], -frame[left * 4])

    def test_nose_has_no_pair(self):
        frame = _identifiable_frame()
        mirrored = mirror_frame_258(frame)
        self.assertAlmostEqual(mirrored[0], -frame[0])
        np.testing.assert_allclose(mirrored[1:4], frame[1:4])

    def test_mirroring_twice_is_identity(self):
        frame = _identifiable_frame()
        np.testing.assert_allclose(mirror_frame_258(mirror_frame_258(frame)), frame)

    def test_absent_hand_stays_zero(self):
        frame = _identifiable_frame()
        frame[HAND_FEATURE_START : HAND_FEATURE_START + HAND_BLOCK_SIZE] = 0.0
        mirrored = mirror_frame_258(frame)
        np.testing.assert_allclose(
            mirrored[HAND_FEATURE_START + HAND_BLOCK_SIZE :], 0.0
        )


class AugmentableMaskTests(unittest.TestCase):
    def test_excludes_pose_visibility(self):
        mask = augmentable_mask(_identifiable_model_frame())
        for slot in range(MODEL_POSE_LANDMARK_COUNT):
            self.assertFalse(mask[slot * 4 + 3])
            self.assertTrue(mask[slot * 4])

    def test_visibility_exclusion_stops_at_the_trimmed_pose(self):
        """Con 33 landmarks el índice 132 caería en visibility; con 19 no existe."""
        mask = augmentable_mask(_identifiable_model_frame())
        self.assertEqual(mask.shape, (STATIC_FEATURES_COUNT,))
        self.assertTrue(mask[MODEL_HAND_FEATURE_START:].all())

    def test_excludes_absent_hand_block(self):
        frame = _identifiable_model_frame()
        frame[MODEL_HAND_FEATURE_START : MODEL_HAND_FEATURE_START + HAND_BLOCK_SIZE] = 0.0
        mask = augmentable_mask(frame)
        self.assertFalse(
            mask[
                MODEL_HAND_FEATURE_START : MODEL_HAND_FEATURE_START + HAND_BLOCK_SIZE
            ].any()
        )
        self.assertTrue(mask[MODEL_HAND_FEATURE_START + HAND_BLOCK_SIZE :].all())

    def test_handles_dynamic_layout_and_sequences(self):
        frame = _identifiable_model_frame()
        frame[MODEL_HAND_FEATURE_START : MODEL_HAND_FEATURE_START + HAND_BLOCK_SIZE] = 0.0
        dynamic = sequence_to_dynamic(np.array([frame, frame]))
        self.assertEqual(dynamic.shape[1], DYNAMIC_FEATURES_COUNT)

        mask = augmentable_mask(dynamic)
        self.assertEqual(mask.shape, dynamic.shape)
        # Mano ausente y su bloque de velocidad quedan intactos en ambos frames.
        self.assertFalse(
            mask[
                :, MODEL_HAND_FEATURE_START : MODEL_HAND_FEATURE_START + HAND_BLOCK_SIZE
            ].any()
        )
        delta_start = STATIC_FEATURES_COUNT
        self.assertFalse(
            mask[:, delta_start : delta_start + HAND_BLOCK_SIZE].any()
        )

    def test_masks_present_hand_in_dynamic_layout(self):
        """El layout de 340D no es divisible por 63: el enmascarado no debe saltarse."""
        frame = _identifiable_model_frame()
        dynamic = sequence_to_dynamic(np.array([frame, frame * 1.5]))
        mask = augmentable_mask(dynamic)

        # Con las dos manos presentes y en movimiento, todo el bloque de manos y
        # sus deltas queda augmentable en el segundo frame.
        self.assertTrue(mask[1, MODEL_HAND_FEATURE_START:STATIC_FEATURES_COUNT].all())
        self.assertTrue(mask[1, _hand_deltas()].all())
        # Y visibility sigue excluido pese al layout nuevo.
        for slot in range(MODEL_POSE_LANDMARK_COUNT):
            self.assertFalse(mask[1, slot * 4 + 3])

    def test_arm_velocity_block_is_augmentable(self):
        """El pose está presente aunque la mano no, así que su velocidad sí se perturba."""
        frame = _identifiable_model_frame()
        frame[MODEL_HAND_FEATURE_START:] = 0.0
        dynamic = sequence_to_dynamic(np.array([frame, frame + 0.1]))
        mask = augmentable_mask(dynamic)
        self.assertTrue(mask[:, _pose_deltas()].all())


if __name__ == "__main__":
    unittest.main()
