interface DominantHandSelectorProps {
  dominantHand: "right" | "left";
  onChange: (hand: "right" | "left") => void;
}

export function DominantHandSelector({
  dominantHand,
  onChange,
}: DominantHandSelectorProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50">
      <span className="text-sm font-medium uppercase tracking-wider text-gray-500">
        Mano Dominante:
      </span>
      <div className="flex gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="dominantHand"
            value="right"
            checked={dominantHand === "right"}
            onChange={() => onChange("right")}
            className="text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">Derecha</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="dominantHand"
            value="left"
            checked={dominantHand === "left"}
            onChange={() => onChange("left")}
            className="text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">Izquierda</span>
        </label>
      </div>
    </div>
  );
}
