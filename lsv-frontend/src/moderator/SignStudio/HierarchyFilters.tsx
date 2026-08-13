import { Button, Select, Label } from "flowbite-react";
import { HiPlus } from "react-icons/hi";
import type { Lesson } from "./types";

interface HierarchyItem {
  id: string;
  name: string;
}

export interface HierarchyFiltersProps {
  languages: HierarchyItem[];
  selectedLanguageId: string;
  onLanguageChange: (id: string) => void;
  regions: HierarchyItem[];
  selectedRegionId: string;
  onRegionChange: (id: string) => void;
  stages: HierarchyItem[];
  selectedStageId: string;
  onStageChange: (id: string) => void;
  lessons: Lesson[];
  selectedLessonId: string;
  onLessonChange: (id: string) => void;
  onAddSign: () => void;
}

export function HierarchyFilters({
  languages,
  selectedLanguageId,
  onLanguageChange,
  regions,
  selectedRegionId,
  onRegionChange,
  stages,
  selectedStageId,
  onStageChange,
  lessons,
  selectedLessonId,
  onLessonChange,
  onAddSign,
}: HierarchyFiltersProps) {
  return (
    <div className="mb-6 grid grid-cols-1 items-end gap-4 rounded-xl border border-gray-100 bg-gray-50 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 sm:grid-cols-2 lg:grid-cols-5">
      <div className="w-full">
        <Label htmlFor="language">1. Lenguaje</Label>
        <Select
          id="language"
          value={selectedLanguageId}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          <option value="">Elegir lenguaje...</option>
          {Array.isArray(languages) &&
            languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
        </Select>
      </div>

      <div className="w-full">
        <Label htmlFor="region">Región (opcional)</Label>
        <Select
          id="region"
          value={selectedRegionId}
          disabled={!selectedLanguageId}
          onChange={(e) => onRegionChange(e.target.value)}
        >
          <option value="">Global / Principal</option>
          {Array.isArray(regions) &&
            regions.map((reg) => (
              <option key={reg.id} value={reg.id}>
                {reg.name}
              </option>
            ))}
        </Select>
      </div>

      <div className="w-full">
        <Label htmlFor="stage">2. Etapa</Label>
        <Select
          id="stage"
          value={selectedStageId}
          disabled={!selectedLanguageId}
          onChange={(e) => onStageChange(e.target.value)}
        >
          <option value="">Elegir etapa...</option>
          {Array.isArray(stages) &&
            stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </Select>
      </div>

      <div className="w-full">
        <Label htmlFor="lesson">3. Lección</Label>
        <Select
          id="lesson"
          value={selectedLessonId}
          disabled={!selectedStageId}
          onChange={(e) => onLessonChange(e.target.value)}
        >
          <option value="">Elegir lección...</option>
          {Array.isArray(lessons) &&
            lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
        </Select>
      </div>

      <div className="flex justify-end">
        <Button className="w-full md:w-auto" onClick={onAddSign}>
          <HiPlus className="mr-2 size-5" />
          Nueva Seña
        </Button>
      </div>
    </div>
  );
}
