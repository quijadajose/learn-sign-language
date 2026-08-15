import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  Label,
  Textarea,
  Spinner,
  Button,
  Card,
} from "flowbite-react";
import { HiPlus, HiTrash, HiPhotograph } from "react-icons/hi";
import { BACKEND_BASE_URL } from "../../config";
import { isImageUrl } from "../../utils/isImageUrl";
import { NewQuizQuestion, Quiz } from "./types";

interface QuizFormModalProps {
  show: boolean;
  editingQuiz: Quiz | null;
  newQuestions: NewQuizQuestion[];
  submitting: boolean;
  uploadingImage: string | null;
  onClose: () => void;
  onSubmit: () => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (index: number) => void;
  onUpdateQuestion: (index: number, field: "text", value: string) => void;
  onAddOption: (questionIndex: number) => void;
  onRemoveOption: (questionIndex: number, optionIndex: number) => void;
  onUpdateOption: (
    questionIndex: number,
    optionIndex: number,
    field: "text" | "isCorrect",
    value: string | boolean,
  ) => void;
  onSetCorrectOption: (questionIndex: number, optionIndex: number) => void;
  onImageUpload: (
    questionIndex: number,
    optionIndex: number,
    file: File,
  ) => void;
}

export default function QuizFormModal({
  show,
  editingQuiz,
  newQuestions,
  submitting,
  uploadingImage,
  onClose,
  onSubmit,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onSetCorrectOption,
  onImageUpload,
}: QuizFormModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="4xl">
      <ModalHeader>
        {editingQuiz ? "Editar Quiz" : "Crear Nuevo Quiz"}
      </ModalHeader>
      <ModalBody>
        <div className="space-y-6">
          {newQuestions.map((question, questionIndex) => (
            <Card key={questionIndex}>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pregunta {questionIndex + 1}
                </h4>
                {newQuestions.length > 1 && (
                  <Button
                    size="sm"
                    color="failure"
                    onClick={() => onRemoveQuestion(questionIndex)}
                  >
                    <HiTrash className="size-4" />
                  </Button>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor={`question-${questionIndex}`}>
                  Texto de la pregunta
                </Label>
                <Textarea
                  id={`question-${questionIndex}`}
                  value={question.text}
                  onChange={(e) =>
                    onUpdateQuestion(questionIndex, "text", e.target.value)
                  }
                  placeholder="Escribe la pregunta aquí..."
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Opciones de respuesta</Label>
                  <Button
                    size="sm"
                    color="success"
                    onClick={() => onAddOption(questionIndex)}
                  >
                    <HiPlus className="size-4" />
                  </Button>
                </div>

                {question.options.map((option, optionIndex) => {
                  const uploadKey = `${questionIndex}-${optionIndex}`;
                  const isUploading = uploadingImage === uploadKey;

                  return (
                    <div key={optionIndex} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${questionIndex}`}
                          aria-label={`Marcar opción ${optionIndex + 1} como respuesta correcta`}
                          checked={option.isCorrect}
                          onChange={() =>
                            onSetCorrectOption(questionIndex, optionIndex)
                          }
                          className="size-4 text-blue-600"
                        />

                        <div className="flex-1">
                          {isImageUrl(option.text) ? (
                            <div className="flex items-center gap-3">
                              <img
                                src={`${BACKEND_BASE_URL}${encodeURI(option.text)}`}
                                alt={`Opción ${optionIndex + 1}`}
                                className="h-16 w-24 rounded border object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Imagen cargada
                              </span>
                              <Button
                                size="sm"
                                color="gray"
                                onClick={() =>
                                  onUpdateOption(
                                    questionIndex,
                                    optionIndex,
                                    "text",
                                    "",
                                  )
                                }
                              >
                                Cambiar
                              </Button>
                            </div>
                          ) : (
                            <TextInput
                              value={option.text}
                              onChange={(e) =>
                                onUpdateOption(
                                  questionIndex,
                                  optionIndex,
                                  "text",
                                  e.target.value,
                                )
                              }
                              placeholder="Texto de la opción..."
                              className="flex-1"
                            />
                          )}
                        </div>

                        <div className="flex gap-2">
                          {!isImageUrl(option.text) && (
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`file-input-${questionIndex}-${optionIndex}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    onImageUpload(
                                      questionIndex,
                                      optionIndex,
                                      file,
                                    );
                                  }
                                }}
                                disabled={isUploading}
                              />
                              <label
                                htmlFor={`file-input-${questionIndex}-${optionIndex}`}
                              >
                                <Button
                                  size="sm"
                                  color="blue"
                                  as="span"
                                  className={`cursor-pointer ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                                >
                                  {isUploading ? (
                                    <Spinner size="sm" aria-label="Cargando imagen..." />
                                  ) : (
                                    <HiPhotograph className="size-4" />
                                  )}
                                </Button>
                              </label>
                            </div>
                          )}

                          {question.options.length > 2 && (
                            <Button
                              size="sm"
                              color="failure"
                              onClick={() =>
                                onRemoveOption(questionIndex, optionIndex)
                              }
                            >
                              <HiTrash className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          <Button color="success" onClick={onAddQuestion} className="w-full">
            <HiPlus className="mr-2 size-4" />
            Agregar Pregunta
          </Button>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="success" onClick={onSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Spinner size="sm" className="mr-2" aria-hidden="true" />
              {editingQuiz ? "Actualizando..." : "Creando..."}
            </>
          ) : editingQuiz ? (
            "Actualizar Quiz"
          ) : (
            "Crear Quiz"
          )}
        </Button>
        <Button color="gray" onClick={onClose}>
          Cancelar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
