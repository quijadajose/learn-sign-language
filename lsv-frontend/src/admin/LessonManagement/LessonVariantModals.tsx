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
  Badge,
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  Label,
} from "flowbite-react";
import { HiPlus, HiPencilAlt, HiTrash } from "react-icons/hi";
import QuillEditor from "../../components/QuillEditor";
import { LessonVariant, Region, VariantFormState } from "./types";

interface VariantListModalProps {
  show: boolean;
  variantsLoading: boolean;
  lessonVariants: LessonVariant[];
  selectedLanguageId: string;
  hasLanguagePermission: (languageId: string) => boolean;
  hasRegionPermission: (regionId: string) => boolean;
  onClose: () => void;
  onOpenCreateVariantModal: () => void;
  onOpenVariantEditModal: (variant: LessonVariant) => void;
  onDeleteVariant: (variantId: string) => void;
}

export function VariantListModal({
  show,
  variantsLoading,
  lessonVariants,
  selectedLanguageId,
  hasLanguagePermission,
  hasRegionPermission,
  onClose,
  onOpenCreateVariantModal,
  onOpenVariantEditModal,
  onDeleteVariant,
}: VariantListModalProps) {
  return (
    <Modal show={show} size="6xl" onClose={onClose}>
      <ModalHeader>Variantes Regionales</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Variantes de la Lección
            </h3>
            <Button
              onClick={onOpenCreateVariantModal}
              className="bg-green-600 hover:bg-green-700"
            >
              <HiPlus className="mr-2 size-4" />
              Nueva Variante
            </Button>
          </div>

          {variantsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner size="lg" aria-label="Cargando variantes..." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableHeadCell>Nombre</TableHeadCell>
                  <TableHeadCell>Región</TableHeadCell>
                  <TableHeadCell>Tipo</TableHeadCell>
                  <TableHeadCell>Notas Regionales</TableHeadCell>
                  <TableHeadCell>Acciones</TableHeadCell>
                </TableHead>
                <TableBody className="divide-y">
                  {lessonVariants.map((variant) => (
                    <TableRow
                      key={variant.id}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                      <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {variant.name}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">
                        {variant.region.name} ({variant.region.code})
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {variant.isBase && (
                            <Badge color="green">Base</Badge>
                          )}
                          {variant.isRegionalSpecific && (
                            <Badge color="blue">Específica</Badge>
                          )}
                          {!variant.isBase && !variant.isRegionalSpecific && (
                            <Badge color="gray">Regional</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">
                        {variant.regionalNotes || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {(hasLanguagePermission(selectedLanguageId) ||
                            hasRegionPermission(variant.region.id)) && (
                            <>
                              <Button
                                size="sm"
                                color="info"
                                onClick={() => onOpenVariantEditModal(variant)}
                              >
                                <HiPencilAlt className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                color="failure"
                                onClick={() => onDeleteVariant(variant.id)}
                              >
                                <HiTrash className="size-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onClose}>
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
}

interface VariantFormModalProps {
  show: boolean;
  createLoading: boolean;
  editingVariantId: string | null;
  variantForm: VariantFormState;
  regions: Region[];
  lessonVariants: LessonVariant[];
  selectedLanguageId: string;
  quillEditModules: Record<string, unknown>;
  quillFormats: string[];
  hasLanguagePermission: (languageId: string) => boolean;
  hasRegionPermission: (regionId: string) => boolean;
  onClose: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  onFormChange: (form: VariantFormState) => void;
}

export function VariantFormModal({
  show,
  createLoading,
  editingVariantId,
  variantForm,
  regions,
  lessonVariants,
  selectedLanguageId,
  quillEditModules,
  quillFormats,
  hasLanguagePermission,
  hasRegionPermission,
  onClose,
  onCancel,
  onSubmit,
  onFormChange,
}: VariantFormModalProps) {
  const baseVariant = lessonVariants.find((v) => v.isBase);
  const canSetAsBase = !baseVariant || baseVariant.id === editingVariantId;

  return (
    <Modal show={show} size="4xl" onClose={onClose}>
      <ModalHeader>
        {editingVariantId
          ? "Editar Variante Regional"
          : "Crear Variante Regional"}
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="variant-name">Nombre</Label>
              <TextInput
                id="variant-name"
                value={variantForm.name}
                onChange={(e) =>
                  onFormChange({ ...variantForm, name: e.target.value })
                }
                placeholder="Nombre de la variante regional"
                required
              />
            </div>
            <div>
              <Label htmlFor="variant-region">Región</Label>
              <Select
                id="variant-region"
                value={variantForm.regionId}
                onChange={(e) =>
                  onFormChange({ ...variantForm, regionId: e.target.value })
                }
                required
              >
                <option value="">Selecciona una región</option>
                {regions.flatMap((region) => {
                  const hasPermission =
                    hasLanguagePermission(selectedLanguageId) ||
                    hasRegionPermission(region.id);
                  const regionTaken = lessonVariants.some(
                    (v) => v.region.id === region.id,
                  );
                  const isEditingThisRegion =
                    editingVariantId &&
                    lessonVariants.find((v) => v.id === editingVariantId)
                      ?.region.id === region.id;

                  if (!hasPermission || (regionTaken && !isEditingThisRegion)) {
                    return [];
                  }

                  return (
                    <option key={region.id} value={region.id}>
                      {region.name} ({region.code})
                    </option>
                  );
                })}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="variant-description">Descripción</Label>
            <Textarea
              id="variant-description"
              value={variantForm.description}
              onChange={(e) =>
                onFormChange({
                  ...variantForm,
                  description: e.target.value,
                })
              }
              placeholder="Descripción de la variante"
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="variant-content">Contenido</Label>
            <div className="mt-1">
              <QuillEditor
                value={variantForm.content}
                onChange={(value) =>
                  onFormChange({ ...variantForm, content: value })
                }
                modules={quillEditModules}
                formats={quillFormats}
                theme="snow"
                className="h-48"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="variant-specific"
                checked={variantForm.isRegionalSpecific}
                onChange={(e) =>
                  onFormChange({
                    ...variantForm,
                    isRegionalSpecific: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <Label htmlFor="variant-specific" className="flex items-center gap-1">
                Específica de la región
                <span
                  title="Marca esta variante si el contenido está adaptado a usos, señas o ejemplos propios de esa región."
                  className="inline-flex size-4 cursor-help items-center justify-center rounded-full text-xs font-semibold text-gray-400 ring-1 ring-current hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Más información"
                >
                  ?
                </span>
              </Label>
            </div>
            {canSetAsBase ? (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="variant-base"
                  checked={variantForm.isBase}
                  onChange={(e) =>
                    onFormChange({
                      ...variantForm,
                      isBase: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <Label
                  htmlFor="variant-base"
                  className="flex items-center gap-1"
                >
                  Variante base
                  <span
                    title="Contenido por defecto de la lección. Solo puede haber una por lección; se usa cuando no hay variante para la región del alumno."
                    className="inline-flex size-4 cursor-help items-center justify-center rounded-full text-xs font-semibold text-gray-400 ring-1 ring-current hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Más información"
                  >
                    ?
                  </span>
                </Label>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ya existe una variante base. Esta se guardará como regional.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="variant-notes">Notas Regionales</Label>
            <Textarea
              id="variant-notes"
              value={variantForm.regionalNotes}
              onChange={(e) =>
                onFormChange({
                  ...variantForm,
                  regionalNotes: e.target.value,
                })
              }
              placeholder="Notas sobre las diferencias regionales..."
              rows={2}
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={onSubmit}
          disabled={createLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {createLoading ? <Spinner size="sm" className="mr-2" aria-hidden="true" /> : null}
          {editingVariantId ? "Actualizar Variante" : "Crear Variante"}
        </Button>
        <Button color="gray" onClick={onCancel}>
          Cancelar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
