export interface Region {
  id: string;
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  divisionCode?: string;
  language?: {
    id: string;
    name: string;
    countryCode: string;
  };
}

export interface Country {
  code: string;
  name: string;
}

export interface Division {
  code: string;
  name: string;
  country: Country;
}

export interface ToastMessage {
  id: number;
  type: "success" | "error";
  message: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface CountryOption extends SelectOption {
  data: Country;
}

export interface DivisionOption extends SelectOption {
  data: Division;
}

export interface LanguageOption extends SelectOption {
  countryCode: string;
}

export interface LanguageListItem {
  id: string;
  name: string;
  countryCode?: string;
}

export interface GroupedRegion {
  countryCode: string;
  countryName: string;
  languages: {
    languageId: string;
    languageName: string;
    regions: Region[];
  }[];
}

export interface RegionForm {
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
}
