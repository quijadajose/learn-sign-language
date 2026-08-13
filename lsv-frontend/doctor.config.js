/**
 * React Doctor configuration for lsv-frontend.
 *
 * Accepted residuals (rules intentionally off — false positives or intentional API):
 * - no-set-state-after-await-in-effect: effects use AbortController; detector still
 *   flags post-await setters even when gated on signal.aborted.
 * - no-many-boolean-props / prefer-explicit-variants: modal/recorder APIs intentionally
 *   use explicit boolean flags for clarity across Sign Studio / admin modals.
 * - rerender-lazy-ref-init: useRef(factory()) evaluates factory each render but only
 *   keeps the first value; preferred over render-phase ref mutation
 *   (conflicts with no-ref-current-in-render).
 * - exhaustive-deps: one-shot init effects use effectRan guards; full dep lists would
 *   re-fetch enrollment on every unrelated state change.
 */
export default {
  rules: {
    "react-doctor/no-set-state-after-await-in-effect": "off",
    "react-doctor/no-many-boolean-props": "off",
    "react-doctor/prefer-explicit-variants": "off",
    "react-doctor/rerender-lazy-ref-init": "off",
    "react-doctor/exhaustive-deps": "off",
  },
};
