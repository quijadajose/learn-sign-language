import { useCallback, useEffect, useState } from "react";
import {
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
} from "flowbite-react";
import {
  HiCheck,
  HiChevronDown,
  HiLocationMarker,
  HiPlus,
  HiTranslate,
} from "react-icons/hi";
import { useTranslation } from "react-i18next";
import { languageApi } from "../services/api";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type {
  EnrolledLanguage,
  Language,
  Region,
} from "./LanguageSwitcher/types";

interface SignLanguageContextSwitcherProps {
  onManageEnroll: () => void;
  onManageRegions: () => void;
  onLanguageChanged: (language: Language) => void;
}

function LanguageFlag({
  countryCode,
  name,
  className = "h-5 w-7",
}: {
  countryCode?: string;
  name: string;
  className?: string;
}) {
  if (!countryCode) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-sm bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300 ${className}`}
        aria-hidden
      >
        <HiTranslate className="size-3.5" />
      </span>
    );
  }

  return (
    <img
      src={`/flags/${countryCode.toLowerCase()}.svg`}
      alt=""
      title={name}
      className={`rounded-sm object-cover ${className}`}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

export default function SignLanguageContextSwitcher({
  onManageEnroll,
  onManageRegions,
  onLanguageChanged,
}: SignLanguageContextSwitcherProps) {
  const { t } = useTranslation("nav");
  const [enrolled, setEnrolled] = useState<EnrolledLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguageId, setSelectedLanguageId] = useLocalStorage<
    string | null
  >("selectedLanguageId", null);
  const [selectedRegionId, setSelectedRegionId] = useLocalStorage<
    string | null
  >("selectedRegionId", null);

  const loadEnrolled = useCallback(async () => {
    try {
      const response = await languageApi.getEnrolledLanguages();
      if (!response.success) return;
      const data = response.data as { data: EnrolledLanguage[] };
      setEnrolled(data.data ?? []);
    } catch {
      // Keep previous list; header switcher is best-effort.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEnrolled();

    const refresh = () => {
      void loadEnrolled();
    };
    window.addEventListener("userDataUpdated", refresh);
    return () => window.removeEventListener("userDataUpdated", refresh);
  }, [loadEnrolled]);

  const currentEnrollment = enrolled.find(
    (item) => item.language.id === selectedLanguageId,
  );
  const currentLanguage = currentEnrollment?.language ?? null;
  const currentRegions = currentEnrollment?.enrolledRegions ?? [];
  const currentRegion =
    currentRegions.find((item) => item.region.id === selectedRegionId)
      ?.region ?? null;

  const resolveRegionForLanguage = (
    enrollment: EnrolledLanguage,
  ): string | null => {
    const regions = enrollment.enrolledRegions ?? [];
    if (regions.length === 0) return null;
    if (regions.some((item) => item.region.id === selectedRegionId)) {
      return selectedRegionId;
    }
    return regions[0].region.id;
  };

  const switchLanguage = (enrollment: EnrolledLanguage) => {
    if (enrollment.language.id === selectedLanguageId) return;

    const nextRegionId = resolveRegionForLanguage(enrollment);
    setSelectedLanguageId(enrollment.language.id);
    setSelectedRegionId(nextRegionId);
    window.dispatchEvent(new CustomEvent("userDataUpdated"));
    onLanguageChanged(enrollment.language);
  };

  const switchRegion = (region: Region) => {
    if (region.id === selectedRegionId || !currentLanguage) return;
    setSelectedRegionId(region.id);
    window.dispatchEvent(new CustomEvent("userDataUpdated"));
    onLanguageChanged(currentLanguage);
  };

  if (loading || !currentLanguage || enrolled.length === 0) {
    return null;
  }

  const triggerLabel = currentRegion
    ? `${currentLanguage.name} · ${currentRegion.name}`
    : currentLanguage.name;

  return (
    <Dropdown
      arrowIcon={false}
      inline
      label={
        <span
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
          title={triggerLabel}
          aria-label={`${t("learningLabel")}: ${triggerLabel}`}
        >
          <LanguageFlag
            countryCode={currentLanguage.countryCode}
            name={currentLanguage.name}
            className="h-5 w-7"
          />
          <HiChevronDown className="size-4 shrink-0 text-gray-400" />
        </span>
      }
    >
      <DropdownHeader>
        <span className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("mySignLanguages")}
        </span>
      </DropdownHeader>

      {enrolled.flatMap((enrollment) => {
        const isActive = enrollment.language.id === selectedLanguageId;
        const regions = enrollment.enrolledRegions ?? [];
        const languageItem = (
          <DropdownItem
            key={enrollment.language.id}
            onClick={() => switchLanguage(enrollment)}
            className={isActive ? "bg-blue-50 dark:bg-gray-700" : ""}
          >
            <span className="flex w-full items-center gap-2">
              <LanguageFlag
                countryCode={enrollment.language.countryCode}
                name={enrollment.language.name}
                className="h-4 w-6 shrink-0"
              />
              <span className="min-w-0 flex-1 truncate font-medium">
                {enrollment.language.name}
              </span>
              {isActive && (
                <HiCheck className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
              )}
            </span>
          </DropdownItem>
        );

        if (!isActive) {
          return [languageItem];
        }

        return [
          languageItem,
          ...regions.map((enrolledRegion) => {
            const region = enrolledRegion.region;
            const regionActive = region.id === selectedRegionId;
            return (
              <DropdownItem
                key={`${enrollment.language.id}-${region.id}`}
                onClick={() => switchRegion(region)}
                className="pl-8"
              >
                <span className="flex w-full items-center gap-2 text-sm">
                  <HiLocationMarker className="size-3.5 shrink-0 text-gray-400" />
                  <span className="min-w-0 flex-1 truncate">{region.name}</span>
                  {regionActive && (
                    <HiCheck className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                  )}
                </span>
              </DropdownItem>
            );
          }),
        ];
      })}

      <DropdownDivider />

      <DropdownItem
        onClick={onManageEnroll}
        className="text-blue-700 dark:text-blue-300"
      >
        <HiPlus className="mr-2 size-4" />
        {t("enrollAnotherLanguage")}
      </DropdownItem>
      <DropdownItem onClick={onManageRegions}>
        <HiLocationMarker className="mr-2 size-4" />
        {t("manageRegions")}
      </DropdownItem>
    </Dropdown>
  );
}
