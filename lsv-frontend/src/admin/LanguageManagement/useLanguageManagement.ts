import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, countryDivisionApi } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import {
  Country,
  CountryOption,
  Language,
  LanguageForm,
  LanguageFormErrors,
  LanguageFormTouched,
  ToastMessage,
} from "./types";
import {
  getVisibleLanguageErrors,
  validateLanguageForm,
} from "./languageFormValidation";

const emptyForm: LanguageForm = { name: "", description: "", countryCode: "" };

export function useLanguageManagement() {
  const navigate = useNavigate();
  const { isAdmin, isModerator, canCreateLanguage, hasLanguagePermission, hasAnyPermissionForLanguage } =
    usePermissions();
  const [, setSelectedLanguageId] = useLocalStorage<string | null>(
    "selectedLanguageId",
    null,
  );
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [editForm, setEditForm] = useState<LanguageForm>(emptyForm);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLanguage, setDeletingLanguage] = useState<Language | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<LanguageForm>(emptyForm);
  const [addFormErrors, setAddFormErrors] = useState<LanguageFormErrors>({});
  const [addTouched, setAddTouched] = useState<LanguageFormTouched>({});
  const [addSubmitted, setAddSubmitted] = useState(false);
  const [editFormErrors, setEditFormErrors] = useState<LanguageFormErrors>({});
  const [editTouched, setEditTouched] = useState<LanguageFormTouched>({});
  const [editSubmitted, setEditSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    null,
  );
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [imageTimestamp, setImageTimestamp] = useState<number>(Date.now());
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const isInitialized = useRef(false);

  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [addPreviewUrl, setAddPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!editSelectedFile) {
      setEditPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(editSelectedFile);
    setEditPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [editSelectedFile]);

  useEffect(() => {
    if (!selectedFile) {
      setAddPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setAddPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToastMessages((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const handleManageStages = (languageId: string) => {
    setSelectedLanguageId(languageId);
    navigate("/admin/stages");
  };

  const fetchLanguages = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminApi.getLanguages(page, 100);

        if (!response.success) {
          throw new Error(response.message || "Error al cargar idiomas");
        }

        const data = response.data;
        let fetchedLanguages = data.data || [];

        if (isModerator && !isAdmin) {
          fetchedLanguages = fetchedLanguages.filter((lang: Language) =>
            hasAnyPermissionForLanguage(lang.id),
          );
        }

        setLanguages(fetchedLanguages);
        setTotalPages(Math.ceil(data.total / data.pageSize));
        setCurrentPage(data.page);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error fetching languages";
        setError(errorMessage);
        addToast("error", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [isModerator, isAdmin, hasAnyPermissionForLanguage, addToast],
  );

  const searchCountries = async (searchTerm: string) => {
    if (searchTimeout) {
      window.clearTimeout(searchTimeout);
    }

    if (!searchTerm || searchTerm.length < 2) {
      setCountries([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setLoadingCountries(true);

        const response =
          await countryDivisionApi.getCountriesWithDivisions(searchTerm);

        if (!response.success) {
          throw new Error(response.message || "Error al buscar países");
        }

        setCountries(response.data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error searching countries";
        addToast("error", `Error al buscar países: ${errorMessage}`);
      } finally {
        setLoadingCountries(false);
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    void fetchLanguages();
  }, [fetchLanguages]);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        window.clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchLanguages(page);
  };

  const handleEditClick = (language: Language) => {
    setEditingLanguage(language);
    setEditForm({
      name: language.name,
      description: language.description,
      countryCode: language.countryCode || "",
    });
    setEditFormErrors({});
    setEditTouched({});
    setEditSubmitted(false);
    setEditSelectedFile(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLanguage) return;

    setEditSubmitted(true);
    const errors = validateLanguageForm(editForm, false);
    setEditFormErrors(
      getVisibleLanguageErrors(editForm, editTouched, true, false),
    );
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    let languageUpdateSuccess = false;
    let imageUploadSuccess = false;

    try {
      const response = await adminApi.updateLanguage(
        editingLanguage.id,
        editForm,
      );

      if (response.success) {
        languageUpdateSuccess = true;
      } else {
        const errorMessage = response.message || "Error al actualizar idioma";
        addToast("error", `Error al actualizar idioma: ${errorMessage}`);
      }

      if (editSelectedFile) {
        try {
          const uploadResponse = await adminApi.uploadLanguageImage(
            editSelectedFile,
            editingLanguage.id,
          );

          if (uploadResponse.success) {
            imageUploadSuccess = true;
            setImageTimestamp(Date.now());
          } else {
            const uploadErrorMessage =
              uploadResponse.message || "Error desconocido al subir imagen";
            addToast("error", `Error al subir imagen: ${uploadErrorMessage}`);
          }
        } catch (uploadErr) {
          addToast("error", "Error al subir la imagen.");
        }
      }

      if (languageUpdateSuccess && imageUploadSuccess) {
        addToast("success", "Idioma e imagen actualizados correctamente.");
      } else if (languageUpdateSuccess) {
        addToast("success", "Idioma actualizado correctamente.");
      } else if (imageUploadSuccess) {
        addToast("success", "Imagen actualizada correctamente.");
      }

      if (languageUpdateSuccess || imageUploadSuccess) {
        await fetchLanguages(currentPage);
        setIsEditModalOpen(false);
        setEditingLanguage(null);
        setEditForm(emptyForm);
        setEditSelectedFile(null);
        setError(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error updating language";
      addToast("error", `Error al actualizar idioma: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingLanguage(null);
    setEditForm(emptyForm);
    setEditFormErrors({});
    setEditTouched({});
    setEditSubmitted(false);
    setEditSelectedFile(null);
  };

  const handleDeleteClick = (language: Language) => {
    setDeletingLanguage(language);
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingLanguage(null);
  };

  const handleDeleteSubmit = async () => {
    if (!deletingLanguage) return;

    setIsDeleting(true);
    try {
      const response = await adminApi.deleteLanguage(deletingLanguage.id);

      if (!response.success) {
        throw new Error(response.message || "Error al eliminar idioma");
      }

      await fetchLanguages(currentPage);
      setIsDeleteModalOpen(false);
      setDeletingLanguage(null);
      setError(null);
      addToast("success", "Idioma eliminado correctamente.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error deleting language";
      setError(errorMessage);
      addToast("error", `Error al eliminar idioma: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddClick = () => {
    setAddForm(emptyForm);
    setAddFormErrors({});
    setAddTouched({});
    setAddSubmitted(false);
    setSelectedFile(null);
    setSelectedCountry(null);
    setCountries([]);
    setIsAddModalOpen(true);
  };

  const handleCountryChange = (selectedOption: CountryOption | null) => {
    const nextForm = {
      ...addForm,
      countryCode: selectedOption ? selectedOption.value : "",
    };
    const nextTouched = { ...addTouched, countryCode: true };
    setSelectedCountry(selectedOption);
    setAddForm(nextForm);
    setAddTouched(nextTouched);
    setAddFormErrors(
      getVisibleLanguageErrors(nextForm, nextTouched, addSubmitted, true),
    );
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextForm = { ...addForm, name: e.target.value };
    setAddForm(nextForm);
    setAddFormErrors(
      getVisibleLanguageErrors(nextForm, addTouched, addSubmitted, true),
    );
  };

  const handleAddFieldBlur = (field: keyof LanguageFormTouched) => {
    const nextTouched = { ...addTouched, [field]: true };
    setAddTouched(nextTouched);
    setAddFormErrors(
      getVisibleLanguageErrors(addForm, nextTouched, addSubmitted, true),
    );
  };

  const handleEditFieldBlur = (field: keyof LanguageFormTouched) => {
    const nextTouched = { ...editTouched, [field]: true };
    setEditTouched(nextTouched);
    setEditFormErrors(
      getVisibleLanguageErrors(editForm, nextTouched, editSubmitted, false),
    );
  };

  const handleCancelAdd = () => {
    setIsAddModalOpen(false);
    setAddForm(emptyForm);
    setAddFormErrors({});
    setAddTouched({});
    setAddSubmitted(false);
    setSelectedFile(null);
    setSelectedCountry(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditSelectedFile(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  };

  const handleEditFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setEditSelectedFile(file);
    }
  };

  const handleAddSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddSubmitted(true);
    const errors = validateLanguageForm(addForm, true);
    setAddFormErrors(
      getVisibleLanguageErrors(addForm, addTouched, true, true),
    );
    if (Object.keys(errors).length > 0) return;

    setIsAdding(true);
    try {
      const createResponse = await adminApi.createLanguage(addForm);

      if (!createResponse.success) {
        const errorMessage = createResponse.message || "Error al crear idioma";
        throw new Error(errorMessage);
      }

      const newLanguage = createResponse.data;

      if (selectedFile) {
        try {
          const uploadResponse = await adminApi.uploadLanguageImage(
            selectedFile,
            newLanguage.id,
          );

          if (!uploadResponse.success) {
            const uploadErrorMessage =
              uploadResponse.message || "Error desconocido al subir imagen";
            addToast(
              "error",
              `Idioma creado pero error al subir imagen: ${uploadErrorMessage}`,
            );
          } else {
            setImageTimestamp(Date.now());
          }
        } catch (uploadErr) {
          addToast(
            "error",
            "Idioma creado pero hubo un error al subir la imagen.",
          );
        }
      }

      await fetchLanguages(currentPage);
      setIsAddModalOpen(false);
      setAddForm(emptyForm);
      setAddFormErrors({});
      setAddTouched({});
      setAddSubmitted(false);
      setSelectedFile(null);
      setError(null);
      setSelectedLanguageId(newLanguage.id);
      addToast("success", "Idioma creado. Continúa con la configuración.");
      navigate(`/admin/languages/${newLanguage.id}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error creating language";
      // Keep errors inside the modal flow; avoid page banner under the dialog.
      addToast("error", `Error al crear idioma: ${errorMessage}`);
    } finally {
      setIsAdding(false);
    }
  };

  return {
    canCreateLanguage,
    hasLanguagePermission,
    hasAnyPermissionForLanguage,
    isAdmin,
    languages,
    loading,
    error,
    currentPage,
    totalPages,
    toastMessages,
    setToastMessages,
    imageTimestamp,
    isEditModalOpen,
    editingLanguage,
    editForm,
    setEditForm: (form: LanguageForm) => {
      setEditForm(form);
      setEditFormErrors(
        getVisibleLanguageErrors(form, editTouched, editSubmitted, false),
      );
    },
    editFormErrors,
    handleEditFieldBlur,
    editSelectedFile,
    editPreviewUrl,
    isSubmitting,
    isDeleteModalOpen,
    deletingLanguage,
    isDeleting,
    isAddModalOpen,
    addForm,
    setAddForm: (form: LanguageForm) => {
      setAddForm(form);
      setAddFormErrors(
        getVisibleLanguageErrors(form, addTouched, addSubmitted, true),
      );
    },
    addFormErrors,
    handleAddFieldBlur,
    selectedFile,
    addPreviewUrl,
    isAdding,
    countries,
    selectedCountry,
    loadingCountries,
    isDark,
    handleManageStages,
    handlePageChange,
    handleEditClick,
    handleEditSubmit,
    handleCancelEdit,
    handleDeleteClick,
    handleCancelDelete,
    handleDeleteSubmit,
    handleAddClick,
    handleCountryChange,
    handleNameChange,
    handleCancelAdd,
    handleFileChange,
    handleEditFileChange,
    handleFileDrop,
    handleEditFileDrop,
    handleAddSubmit,
    searchCountries,
  };
}
