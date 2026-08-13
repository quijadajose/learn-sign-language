import React from "react";
import {
  Button,
  Card,
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
} from "flowbite-react";
import {
  HiPencil,
  HiTrash,
  HiEye,
  HiChevronDown,
  HiChevronRight,
} from "react-icons/hi";
import type { GroupedRegion, Region } from "./types";

interface GroupedRegionListProps {
  totalRegions: number;
  groupedRegions: GroupedRegion[];
  expandedCountries: Set<string>;
  expandedLanguages: Set<string>;
  toggleCountry: (countryCode: string) => void;
  toggleLanguage: (languageKey: string) => void;
  hasRegionPermission: (regionId: string) => boolean;
  hasLanguagePermission: (languageId: string) => boolean;
  onView: (region: Region) => void;
  onEdit: (region: Region) => void;
  onDelete: (region: Region) => void;
}

function RegionActions({
  region,
  hasRegionPermission,
  hasLanguagePermission,
  onView,
  onEdit,
  onDelete,
}: {
  region: Region;
  hasRegionPermission: (regionId: string) => boolean;
  hasLanguagePermission: (languageId: string) => boolean;
  onView: (region: Region) => void;
  onEdit: (region: Region) => void;
  onDelete: (region: Region) => void;
}) {
  return (
    <div className="flex space-x-2">
      <Button size="sm" color="light" onClick={() => onView(region)}>
        <HiEye className="size-4" />
      </Button>
      {hasRegionPermission(region.id) && (
        <>
          <Button size="sm" color="light" onClick={() => onEdit(region)}>
            <HiPencil className="size-4" />
          </Button>
          {hasLanguagePermission(region.language?.id || "") && (
            <Button
              size="sm"
              color="failure"
              onClick={() => onDelete(region)}
            >
              <HiTrash className="size-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function RegionRow({
  region,
  indentClass,
  hasRegionPermission,
  hasLanguagePermission,
  onView,
  onEdit,
  onDelete,
}: {
  region: Region;
  indentClass: string;
  hasRegionPermission: (regionId: string) => boolean;
  hasLanguagePermission: (languageId: string) => boolean;
  onView: (region: Region) => void;
  onEdit: (region: Region) => void;
  onDelete: (region: Region) => void;
}) {
  return (
    <TableRow
      key={region.id}
      className="bg-white dark:border-gray-700 dark:bg-gray-900"
    >
      <TableCell
        className={`whitespace-nowrap ${indentClass} font-medium text-gray-900 dark:text-white`}
      >
        {region.name}
      </TableCell>
      <TableCell className="whitespace-nowrap text-gray-900 dark:text-white">
        {region.code}
      </TableCell>
      <TableCell className="text-gray-900 dark:text-white">
        {region.description.length > 50
          ? `${region.description.substring(0, 50)}...`
          : region.description}
      </TableCell>
      <TableCell>
        {region.isDefault ? (
          <Badge color="blue">Base</Badge>
        ) : (
          <Badge color="gray">Regional</Badge>
        )}
      </TableCell>
      <TableCell>
        <RegionActions
          region={region}
          hasRegionPermission={hasRegionPermission}
          hasLanguagePermission={hasLanguagePermission}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}

export default function GroupedRegionList({
  totalRegions,
  groupedRegions,
  expandedCountries,
  expandedLanguages,
  toggleCountry,
  toggleLanguage,
  hasRegionPermission,
  hasLanguagePermission,
  onView,
  onEdit,
  onDelete,
}: GroupedRegionListProps) {
  return (
    <Card>
      <div className="mb-4 text-sm text-gray-700 dark:text-gray-400">
        Mostrando {totalRegions} regiones agrupadas por país e idioma
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableHeadCell>Nombre</TableHeadCell>
            <TableHeadCell>Código</TableHeadCell>
            <TableHeadCell>Descripción</TableHeadCell>
            <TableHeadCell>Tipo</TableHeadCell>
            <TableHeadCell>Acciones</TableHeadCell>
          </TableHead>
          <TableBody className="divide-y">
            {groupedRegions.map((countryGroup) => {
                const isCountryExpanded = expandedCountries.has(
                  countryGroup.countryCode,
                );
                const countryKey = countryGroup.countryCode;

                return (
                  <React.Fragment key={countryKey}>
                    <TableRow className="bg-gray-100 dark:bg-gray-700">
                      <TableCell
                        colSpan={5}
                        className="font-semibold text-gray-900 dark:text-white"
                      >
                        <button
                          onClick={() => toggleCountry(countryKey)}
                          className="flex items-center space-x-2 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {isCountryExpanded ? (
                            <HiChevronDown className="size-5" />
                          ) : (
                            <HiChevronRight className="size-5" />
                          )}
                          <div className="flex items-center space-x-2">
                            <img
                              src={`/flags/${countryKey.toLowerCase()}.svg`}
                              alt=""
                              className="h-4 w-6 rounded-sm object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            <span>
                              {countryGroup.languages.length === 1
                                ? countryGroup.languages[0].languageName
                                : `${countryGroup.countryName} (${countryGroup.countryCode})`}
                            </span>
                          </div>
                          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                            (
                            {countryGroup.languages.length === 1
                              ? countryGroup.languages[0].regions.length
                              : countryGroup.languages.length}{" "}
                            {countryGroup.languages.length === 1
                              ? countryGroup.languages[0].regions.length === 1
                                ? "región"
                                : "regiones"
                              : countryGroup.languages.length === 1
                                ? "idioma"
                                : "idiomas"}
                            )
                          </span>
                        </button>
                      </TableCell>
                    </TableRow>

                    {isCountryExpanded &&
                      (countryGroup.languages.length === 1
                        ? countryGroup.languages[0].regions.map((region) => (
                            <RegionRow
                              key={region.id}
                              region={region}
                              indentClass="pl-8"
                              hasRegionPermission={hasRegionPermission}
                              hasLanguagePermission={hasLanguagePermission}
                              onView={onView}
                              onEdit={onEdit}
                              onDelete={onDelete}
                            />
                          ))
                        : countryGroup.languages.map((languageGroup) => {
                            const languageKey = `${countryKey}-${languageGroup.languageId}`;
                            const isLanguageExpanded =
                              expandedLanguages.has(languageKey);

                            return (
                              <React.Fragment key={languageKey}>
                                <TableRow className="bg-gray-50 dark:bg-gray-800">
                                  <TableCell
                                    colSpan={5}
                                    className="pl-8 font-medium text-gray-800 dark:text-gray-200"
                                  >
                                    <button
                                      onClick={() =>
                                        toggleLanguage(languageKey)
                                      }
                                      className="flex items-center space-x-2 hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                      {isLanguageExpanded ? (
                                        <HiChevronDown className="size-4" />
                                      ) : (
                                        <HiChevronRight className="size-4" />
                                      )}
                                      <span>{languageGroup.languageName}</span>
                                      <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                        ({languageGroup.regions.length}{" "}
                                        {languageGroup.regions.length === 1
                                          ? "región"
                                          : "regiones"}
                                        )
                                      </span>
                                    </button>
                                  </TableCell>
                                </TableRow>

                                {isLanguageExpanded &&
                                  languageGroup.regions.map((region) => (
                                    <RegionRow
                                      key={region.id}
                                      region={region}
                                      indentClass="pl-12"
                                      hasRegionPermission={hasRegionPermission}
                                      hasLanguagePermission={
                                        hasLanguagePermission
                                      }
                                      onView={onView}
                                      onEdit={onEdit}
                                      onDelete={onDelete}
                                    />
                                  ))}
                              </React.Fragment>
                            );
                          }))}
                  </React.Fragment>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
