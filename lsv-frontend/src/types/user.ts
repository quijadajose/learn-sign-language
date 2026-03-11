export type PermissionScope = "language" | "region";

export interface Language {
  id: string;
  name: string;
  description?: string;
  countryCode?: string;
  createdAt?: string;
  updatedAt?: string;
  regions?: Region[];
}

export interface Region {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault?: boolean;
  languageId?: string;
  language?: Language;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModeratorPermission {
  id: string;
  userId: string;
  scope: PermissionScope;
  languageId?: string;
  language?: Language;
  regionId?: string;
  region?: Region;
  createdAt: string;
}

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string;
  role?: string;
  age?: number;
  isRightHanded?: boolean;
  createdAt?: string;
  moderatorPermissions?: ModeratorPermission[];
}
