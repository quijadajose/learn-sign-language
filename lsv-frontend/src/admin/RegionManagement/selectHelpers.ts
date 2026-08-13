import type { CSSObjectWithLabel, StylesConfig } from "react-select";

export function getSelectStyles<Option>(
  isDarkMode: boolean,
): StylesConfig<Option, false> {
  return {
    control: (base: CSSObjectWithLabel, state) => ({
      ...base,
      minHeight: "42px",
      border: `1px solid ${isDarkMode ? "#4b5563" : "#d1d5db"}`,
      borderRadius: "0.375rem",
      backgroundColor: isDarkMode ? "#374151" : "transparent",
      color: isDarkMode ? "#f3f4f6" : "inherit",
      "&:hover": {
        borderColor: isDarkMode ? "#6b7280" : "#9ca3af",
      },
      ...(state.isFocused && {
        borderColor: "#3b82f6",
        boxShadow: "0 0 0 1px #3b82f6",
      }),
    }),
    placeholder: (base: CSSObjectWithLabel) => ({
      ...base,
      color: isDarkMode ? "#9ca3af" : "#6b7280",
    }),
    singleValue: (base: CSSObjectWithLabel) => ({
      ...base,
      color: isDarkMode ? "#f3f4f6" : "inherit",
    }),
    input: (base: CSSObjectWithLabel) => ({
      ...base,
      color: isDarkMode ? "#f3f4f6" : "inherit",
    }),
    menu: (base: CSSObjectWithLabel) => ({
      ...base,
      backgroundColor: isDarkMode ? "#374151" : "white",
      border: `1px solid ${isDarkMode ? "#4b5563" : "#e5e7eb"}`,
      borderRadius: "0.375rem",
      boxShadow: isDarkMode
        ? "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)"
        : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    }),
    option: (base: CSSObjectWithLabel, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
          ? isDarkMode
            ? "#4b5563"
            : "#f3f4f6"
          : "transparent",
      color: state.isSelected ? "white" : isDarkMode ? "#f3f4f6" : "inherit",
      "&:hover": {
        backgroundColor: state.isSelected
          ? "#3b82f6"
          : isDarkMode
            ? "#4b5563"
            : "#f3f4f6",
      },
    }),
  };
}

export function getSelectTheme(isDarkMode: boolean) {
  return {
    borderRadius: 6,
    spacing: {
      baseUnit: 4,
      controlHeight: 42,
      menuGutter: 8,
    },
    colors: {
      primary: "#3b82f6",
      primary75: "#60a5fa",
      primary50: "#93c5fd",
      primary25: "#dbeafe",
      danger: "#ef4444",
      dangerLight: "#fecaca",
      neutral0: isDarkMode ? "#374151" : "white",
      neutral5: isDarkMode ? "#1f2937" : "#f9fafb",
      neutral10: isDarkMode ? "#374151" : "#f3f4f6",
      neutral20: isDarkMode ? "#4b5563" : "#e5e7eb",
      neutral30: isDarkMode ? "#6b7280" : "#d1d5db",
      neutral40: isDarkMode ? "#9ca3af" : "#9ca3af",
      neutral50: isDarkMode ? "#d1d5db" : "#6b7280",
      neutral60: isDarkMode ? "#e5e7eb" : "#4b5563",
      neutral70: isDarkMode ? "#f3f4f6" : "#374151",
      neutral80: isDarkMode ? "#f9fafb" : "#1f2937",
      neutral90: isDarkMode ? "#ffffff" : "#111827",
    },
  };
}
