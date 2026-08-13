import { PermissionScope } from "../../types/user";

export interface ModeratorPermission {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  scope: PermissionScope;
  language?: {
    id: string;
    name: string;
  };
  region?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface Language {
  id: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
  languageId?: string;
}

export interface ToastMessage {
  id: number;
  type: "success" | "error";
  message: string;
}

export interface UserSelectOption {
  value: string;
  label: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

import { moderatorApi } from "../../services/api";

export async function loadUserOptions(
  inputValue: string,
): Promise<UserSelectOption[]> {
  if (!inputValue || inputValue.trim().length < 2) {
    return [];
  }

  try {
    const response = await moderatorApi.searchUsers(inputValue.trim());

    if (response.success && response.data) {
      const users = Array.isArray(response.data) ? response.data : [];
      return users.map(
        (user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
        }) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName} (${user.email})`,
          user,
        }),
      );
    }
    return [];
  } catch {
    return [];
  }
}
