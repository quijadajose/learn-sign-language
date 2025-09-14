import { useState, useEffect } from "react";
import { regionApi } from "../services/api";
import { useLocalStorage } from "./useLocalStorage";

interface Region {
  id: string;
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useRegion = (languageId?: string) => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useLocalStorage<
    string | null
  >("selectedRegionId", null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRegions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await regionApi.getRegions(1, 100, languageId);

      if (response.success) {
        setRegions(response.data.data || []);

        if (!selectedRegionId) {
          const defaultRegion = response.data.data?.find(
            (region: Region) => region.isDefault,
          );
          if (defaultRegion) {
            setSelectedRegionId(defaultRegion.id);
          }
        }
      } else {
        setError(response.message || "Error al cargar las regiones");
      }
    } catch (err) {
      setError("Error de conexión al cargar las regiones");
    } finally {
      setLoading(false);
    }
  };

  const selectRegion = (regionId: string) => {
    setSelectedRegionId(regionId);
  };

  const getSelectedRegion = (): Region | null => {
    return regions.find((region) => region.id === selectedRegionId) || null;
  };

  useEffect(() => {
    loadRegions();
  }, [languageId]);

  return {
    regions,
    selectedRegionId,
    selectedRegion: getSelectedRegion(),
    loading,
    error,
    selectRegion,
    refreshRegions: loadRegions,
  };
};
