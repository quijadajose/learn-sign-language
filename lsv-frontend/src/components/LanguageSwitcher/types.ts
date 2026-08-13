export interface Language {
  id: string;
  name: string;
  description: string;
  countryCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrolledLanguage {
  language: Language;
  enrolledRegions?: EnrolledRegion[];
}

export interface PaginatedEnrolledLanguageResponse {
  data: EnrolledLanguage[];
}

export interface PaginatedLanguageResponse {
  data: Language[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
  language: Language;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedRegionResponse {
  data: Region[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EnrolledRegion {
  region: Region;
}

export interface PaginatedEnrolledRegionResponse {
  data: EnrolledRegion[];
  total: number;
  page: number;
  pageSize: number;
}

export type LanguageSwitcherTab = "enroll" | "regions";

export interface LanguageSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onLanguageChanged: (language: Language) => void;
  /** Opens on "Inscribirme" or "Mis idiomas". */
  initialTab?: LanguageSwitcherTab;
}
