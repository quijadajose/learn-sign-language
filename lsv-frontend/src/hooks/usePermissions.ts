import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export const usePermissions = () => {
  const { user } = useAuth();

  const isAdmin = useMemo(() => {
    return user?.role === "admin";
  }, [user?.role]);

  const isModerator = useMemo(() => {
    return (
      !isAdmin &&
      user?.moderatorPermissions !== undefined &&
      user.moderatorPermissions.length > 0
    );
  }, [isAdmin, user?.moderatorPermissions]);

  const hasLanguagePermission = (languageId: string): boolean => {
    if (isAdmin) return true;
    if (!user?.moderatorPermissions) return false;

    return user.moderatorPermissions.some(
      (p) => p.scope === "language" && p.languageId === languageId,
    );
  };

  const hasRegionPermission = (regionId: string): boolean => {
    if (isAdmin) return true;
    if (!user?.moderatorPermissions) return false;

    // Verificar permiso directo de región
    const hasDirectRegionPermission = user.moderatorPermissions.some(
      (p) => p.scope === "region" && p.regionId === regionId,
    );

    if (hasDirectRegionPermission) return true;

    const hasLanguagePermission = user.moderatorPermissions.some(
      (p) =>
        p.scope === "language" &&
        p.language?.regions?.some((r) => r.id === regionId),
    );

    return hasLanguagePermission;
  };

  const hasAnyPermissionForLanguage = (languageId: string): boolean => {
    if (isAdmin) return true;
    if (!user?.moderatorPermissions) return false;

    return user.moderatorPermissions.some((p) => {
      if (p.scope === "language" && p.languageId === languageId) return true;
      if (
        p.scope === "region" &&
        (p.region?.languageId === languageId ||
          p.region?.language?.id === languageId)
      )
        return true;
      return false;
    });
  };

  const hasAnyLanguagePermission = (): boolean => {
    if (isAdmin) return true;
    if (!user?.moderatorPermissions) return false;
    return user.moderatorPermissions.some((p) => p.scope === "language");
  };

  const hasAnyRegionPermission = (): boolean => {
    if (isAdmin) return true;
    if (!user?.moderatorPermissions) return false;
    return user.moderatorPermissions.some((p) => p.scope === "region");
  };

  const canCreateLanguage = (): boolean => {
    return isAdmin;
  };

  return {
    isAdmin,
    isModerator,
    hasLanguagePermission,
    hasRegionPermission,
    canCreateLanguage,
    hasAnyLanguagePermission,
    hasAnyRegionPermission,
    hasAnyPermissionForLanguage,
    user,
  };
};
