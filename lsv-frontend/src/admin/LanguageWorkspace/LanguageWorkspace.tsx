import {
  Alert,
  Button,
  Spinner,
  Toast,
  ToastToggle,
} from "flowbite-react";
import {
  HiArrowLeft,
  HiArrowRight,
  HiCollection,
  HiExclamationCircle,
  HiGlobe,
  HiBookOpen,
  HiUserGroup,
  HiVideoCamera,
  HiAcademicCap,
  HiPlus,
  HiCheck,
  HiX,
} from "react-icons/hi";
import ContentSetupChecklist from "../setup/ContentSetupChecklist";
import AssignPermissionModal from "../ModeratorManagement/AssignPermissionModal";
import { useLanguageWorkspace } from "./useLanguageWorkspace";

export default function LanguageWorkspace() {
  const {
    language,
    counts,
    permissions,
    loading,
    error,
    toast,
    setToast,
    steps,
    nextStep,
    isAdmin,
    goToStep,
    navigate,
    isAssignModalOpen,
    isSubmitting,
    selectedUser,
    selectedScope,
    selectedTargetId,
    assignLanguageId,
    languagesForModal,
    regions,
    openAssignModal,
    closeAssignModal,
    handleAssignPermission,
    handleScopeChange,
    handleUserChange,
    setSelectedTargetId,
    setAssignLanguageId,
  } = useLanguageWorkspace();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error || !language) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Alert color="failure" icon={HiExclamationCircle}>
          {error || "Lenguaje no encontrado"}
        </Alert>
        <Button color="light" onClick={() => navigate("/admin/languages")}>
          <HiArrowLeft className="mr-2 size-4" />
          Volver a lenguajes
        </Button>
      </div>
    );
  }

  const links = [
    {
      title: "Etapas",
      description: `${counts?.stageCount ?? 0} configuradas`,
      icon: HiCollection,
      path: "/admin/stages",
    },
    {
      title: "Regiones",
      description: `${counts?.regionCount ?? 0} configuradas`,
      icon: HiGlobe,
      path: "/admin/regions",
    },
    {
      title: "Lecciones",
      description: `${counts?.lessonCount ?? 0} creadas`,
      icon: HiBookOpen,
      path: "/admin/lessons",
    },
    {
      title: "Sign Studio",
      description: "Grabar y entrenar señas",
      icon: HiVideoCamera,
      path: `/admin/sign-studio?languageId=${language.id}`,
    },
  ];

  return (
    <>
      {toast && (
        <div className="fixed right-5 top-5 z-[9999]">
          <Toast>
            <div
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
                toast.type === "success"
                  ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
                  : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
              }`}
            >
              {toast.type === "success" ? (
                <HiCheck className="size-5" />
              ) : (
                <HiX className="size-5" />
              )}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <ToastToggle onDismiss={() => setToast(null)} />
          </Toast>
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        <div>
          <Button
            color="light"
            size="sm"
            className="mb-4"
            onClick={() => navigate("/admin/languages")}
          >
            <HiArrowLeft className="mr-2 size-4" />
            Todos los lenguajes
          </Button>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {language.countryCode && (
                <img
                  src={`/flags/${language.countryCode.toLowerCase()}.svg`}
                  alt=""
                  className="mt-1 h-10 w-14 rounded-sm object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {language.name}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                  {language.description ||
                    "Panel de administración de este lenguaje"}
                </p>
              </div>
            </div>
            {isAdmin && (
              <Button color="blue" onClick={openAssignModal}>
                <HiPlus className="mr-2 size-4" />
                Invitar moderador
              </Button>
            )}
          </div>
        </div>

        <ContentSetupChecklist
          languageName={language.name}
          steps={steps}
          nextStep={nextStep}
          onGoToStep={goToStep}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.title}
                type="button"
                onClick={() => navigate(link.path)}
                className="rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="rounded-lg bg-blue-50 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {link.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <HiArrowRight className="mt-1 size-4 text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <HiUserGroup className="size-5" />
                  Moderadores
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Personas que pueden gestionar este lenguaje o sus regiones.
                </p>
              </div>
              <Button color="light" size="sm" onClick={openAssignModal}>
                <HiPlus className="mr-1 size-4" />
                Asignar
              </Button>
            </div>

            {permissions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aún no hay moderadores. Es opcional, pero ayuda a repartir la
                carga de contenido y grabaciones.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {permissions.map((permission) => (
                  <li
                    key={permission.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {permission.user.firstName} {permission.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {permission.user.email}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                      {permission.scope === "language"
                        ? "Lenguaje completo"
                        : `Región: ${permission.region?.name ?? "—"}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4">
              <Button
                size="xs"
                color="light"
                onClick={() => navigate("/admin/moderators")}
              >
                Ver gestión global
                <HiArrowRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </section>
        )}

        <Alert color="info">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Los quizzes son la alternativa sin cámara. Las señas se graban en
              Sign Studio.
            </span>
            <Button
              size="xs"
              color="light"
              onClick={() => navigate("/admin/lessons")}
            >
              <HiAcademicCap className="mr-1 size-3.5" />
              Ir a lecciones
            </Button>
          </div>
        </Alert>
      </div>

      {isAdmin && (
        <AssignPermissionModal
          show={isAssignModalOpen}
          isSubmitting={isSubmitting}
          selectedUser={selectedUser}
          selectedScope={selectedScope}
          selectedTargetId={selectedTargetId}
          selectedLanguageId={assignLanguageId}
          languages={languagesForModal}
          regions={regions}
          onClose={closeAssignModal}
          onSubmit={handleAssignPermission}
          onUserChange={handleUserChange}
          onScopeChange={handleScopeChange}
          onTargetIdChange={setSelectedTargetId}
          onLanguageIdChange={setAssignLanguageId}
        />
      )}
    </>
  );
}
