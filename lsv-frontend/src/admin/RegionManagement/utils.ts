import type { Country, GroupedRegion, Region } from "./types";

export function groupRegionsByCountryAndLanguage(
  regions: Region[],
  countries: Country[],
): GroupedRegion[] {
  const grouped = new Map<string, GroupedRegion>();

  regions.forEach((region) => {
    if (!region.language) return;

    const hasCountry = !!region.language!.countryCode;
    const groupKey = hasCountry
      ? region.language!.countryCode
      : region.language!.id;

    let groupName = "";
    if (hasCountry) {
      const country = countries.find(
        (c) => c.code === region.language!.countryCode,
      );
      groupName = country?.name || region.language!.countryCode;
    } else {
      groupName = region.language!.name;
    }

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        countryCode: groupKey,
        countryName: groupName,
        languages: [],
      });
    }

    const countryGroup = grouped.get(groupKey)!;
    let languageGroup = countryGroup.languages.find(
      (l) => l.languageId === region.language!.id,
    );

    if (!languageGroup) {
      languageGroup = {
        languageId: region.language!.id,
        languageName: region.language!.name,
        regions: [],
      };
      countryGroup.languages.push(languageGroup);
    }

    languageGroup.regions.push(region);
  });

  grouped.forEach((countryGroup) => {
    countryGroup.languages.sort((a, b) =>
      a.languageName.localeCompare(b.languageName),
    );
  });

  return Array.from(grouped.values()).sort((a, b) =>
    a.countryName.localeCompare(b.countryName),
  );
}
