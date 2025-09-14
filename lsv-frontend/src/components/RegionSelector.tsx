import { Select, Spinner, Alert } from "flowbite-react";
import { useRegion } from "../hooks/useRegion";

interface RegionSelectorProps {
  onRegionChange?: (regionId: string) => void;
  showLabel?: boolean;
  className?: string;
}

export default function RegionSelector({
  onRegionChange,
  showLabel = true,
  className = "",
}: RegionSelectorProps) {
  const {
    regions,
    selectedRegionId,
    selectedRegion,
    loading,
    error,
    selectRegion,
  } = useRegion();

  const handleRegionChange = (regionId: string) => {
    selectRegion(regionId);
    onRegionChange?.(regionId);
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Spinner size="sm" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Cargando regiones...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert color="failure" className={className}>
        <span className="font-medium">Error!</span> {error}
      </Alert>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Región
        </label>
      )}
      <Select
        value={selectedRegionId || ""}
        onChange={(e) => handleRegionChange(e.target.value)}
        className="w-full"
      >
        <option value="">Selecciona una región</option>
        {regions.map((region) => (
          <option key={region.id} value={region.id}>
            {region.name} {region.isDefault && "(Base)"}
          </option>
        ))}
      </Select>
      {selectedRegion && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {selectedRegion.description}
        </p>
      )}
    </div>
  );
}
