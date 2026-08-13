import { useCallback } from "react";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  Spinner,
  TextInput,
  Textarea,
} from "flowbite-react";
import QuillEditor from "../../components/QuillEditor";
import { Language, LessonFormState, StageItem } from "./types";

interface QuillConfig {
  modules: Record<string, unknown>;
  formats: string[];
}

interface LessonFormModalBaseProps {
  show: boolean;
  loading: boolean;
  form: LessonFormState;
  languages: Language[];
  stages: StageItem[];
  stagesLoading: boolean;
  quillConfig: QuillConfig;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (
    updater: (prev: LessonFormState) => LessonFormState,
  ) => void;
  /** Kept for callers; language is locked to page context. */
  onLanguageChange?: (languageId: string) => void;
}

interface CreateLessonFormModalProps extends LessonFormModalBaseProps {
  mode: "create";
}

interface EditLessonFormModalProps extends LessonFormModalBaseProps {
  mode: "edit";
}

type LessonFormModalProps =
  | CreateLessonFormModalProps
  | EditLessonFormModalProps;

function LanguageContextBanner({ language }: { language: Language | null }) {
  if (!language) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        Selecciona un lenguaje en la página antes de crear la lección.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
      {language.countryCode && (
        <img
          src={`/flags/${language.countryCode.toLowerCase()}.svg`}
          alt=""
          className="h-6 w-9 rounded-sm object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
          Lenguaje
        </p>
        <p className="font-semibold text-gray-900 dark:text-white">
          {language.name}
        </p>
      </div>
    </div>
  );
}

function LessonFormFields({
  mode,
  form,
  languages,
  stages,
  stagesLoading,
  quillConfig,
  contentWrapperClassName,
  onFormChange,
}: {
  mode: "create" | "edit";
  form: LessonFormState;
  languages: Language[];
  stages: StageItem[];
  stagesLoading: boolean;
  quillConfig: QuillConfig;
  contentWrapperClassName?: string;
  onFormChange: (
    updater: (prev: LessonFormState) => LessonFormState,
  ) => void;
}) {
  const language =
    languages.find((item) => item.id === form.languageId) ?? null;

  const handleContentChange = useCallback(
    (content: string) => {
      onFormChange((p) => ({ ...p, content }));
    },
    [onFormChange],
  );

  const contentEditor = (
    <QuillEditor
      value={form.content}
      onChange={handleContentChange}
      modules={quillConfig.modules}
      formats={quillConfig.formats}
      theme="snow"
    />
  );

  return (
    <div className="space-y-6">
      <LanguageContextBanner language={language} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <div>
          <label
            htmlFor="lesson-form-stage"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Etapa <span className="text-red-500">*</span>
          </label>
          <Select
            id="lesson-form-stage"
            value={form.stageId}
            onChange={(e) =>
              onFormChange((p) => ({ ...p, stageId: e.target.value }))
            }
            disabled={!form.languageId || stagesLoading}
          >
            <option value="">
              {stagesLoading ? "Cargando etapas…" : "Selecciona una etapa"}
            </option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </Select>
          {mode === "create" && !stagesLoading && stages.length === 0 && (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              Este lenguaje aún no tiene etapas. Crea una en Gestión → Etapas.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="lesson-form-name"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Nombre <span className="text-red-500">*</span>
          </label>
          <TextInput
            id="lesson-form-name"
            value={form.name}
            onChange={(e) =>
              onFormChange((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="Nombre de la lección"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="lesson-form-description"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Descripción <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="lesson-form-description"
          rows={3}
          value={form.description}
          onChange={(e) =>
            onFormChange((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="Descripción de la lección"
        />
      </div>

      <div>
        <label
          htmlFor="lesson-form-content"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Contenido
        </label>
        {contentWrapperClassName ? (
          <div id="lesson-form-content" className={contentWrapperClassName}>
            {contentEditor}
          </div>
        ) : (
          <div id="lesson-form-content">{contentEditor}</div>
        )}
      </div>
    </div>
  );
}

function LessonFormActions({
  loading,
  submitLabel,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  submitLabel: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex w-full justify-end gap-2">
      <Button color="light" onClick={onClose} disabled={loading}>
        Cancelar
      </Button>
      <Button
        color="blue"
        onClick={onSubmit}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {loading && <Spinner size="sm" className="mr-2" />}
        {submitLabel}
      </Button>
    </div>
  );
}

export function CreateLessonFormModal({
  show,
  loading,
  form,
  languages,
  stages,
  stagesLoading,
  quillConfig,
  onClose,
  onSubmit,
  onFormChange,
}: CreateLessonFormModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="5xl">
      <ModalHeader>Agregar lección</ModalHeader>
      <ModalBody className="max-h-[min(70vh,40rem)] overflow-y-auto">
        <LessonFormFields
          mode="create"
          form={form}
          languages={languages}
          stages={stages}
          stagesLoading={stagesLoading}
          quillConfig={quillConfig}
          onFormChange={onFormChange}
        />
      </ModalBody>
      <ModalFooter className="sticky bottom-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <LessonFormActions
          loading={loading}
          submitLabel="Crear lección"
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </ModalFooter>
    </Modal>
  );
}

export function EditLessonFormModal({
  show,
  loading,
  form,
  languages,
  stages,
  stagesLoading,
  quillConfig,
  onClose,
  onSubmit,
  onFormChange,
}: EditLessonFormModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="5xl">
      <ModalHeader>Editar lección</ModalHeader>
      <ModalBody className="max-h-[min(70vh,40rem)] overflow-y-auto">
        <LessonFormFields
          mode="edit"
          form={form}
          languages={languages}
          stages={stages}
          stagesLoading={stagesLoading}
          quillConfig={quillConfig}
          contentWrapperClassName="quill-flowbite rounded-md bg-gray-50 dark:bg-gray-700"
          onFormChange={onFormChange}
        />
      </ModalBody>
      <ModalFooter className="sticky bottom-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <LessonFormActions
          loading={loading}
          submitLabel="Guardar cambios"
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </ModalFooter>
    </Modal>
  );
}

export type { LessonFormModalProps };
