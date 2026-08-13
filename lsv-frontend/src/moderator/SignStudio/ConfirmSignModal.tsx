import { Button, Modal, ModalHeader, ModalBody } from "flowbite-react";
import { HiExclamation } from "react-icons/hi";
import type { ConfirmConfig } from "./types";

export interface ConfirmSignModalProps {
  show: boolean;
  onClose: () => void;
  confirmConfig: ConfirmConfig;
}

export function ConfirmSignModal({ show, onClose, confirmConfig }: ConfirmSignModalProps) {
  return (
<Modal show={show} size="md" popup onClose={onClose}>
        <ModalHeader />
        <ModalBody>
          <div className="pb-6 text-center">
            <HiExclamation className="mx-auto mb-4 size-14 text-red-600 dark:text-red-500" />
            <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">
              {confirmConfig.title}
            </h3>
            <p className="mb-6 whitespace-pre-line px-4 text-sm font-normal text-gray-500 dark:text-gray-400">
              {confirmConfig.message}
            </p>
            <div className="flex justify-center gap-4">
              <Button
                color={confirmConfig.color || "failure"}
                onClick={confirmConfig.onConfirm}
                className={
                  confirmConfig.color === "failure" || !confirmConfig.color
                    ? "border-0 bg-red-600 text-white hover:bg-red-700"
                    : ""
                }
              >
                <span className="px-2">{confirmConfig.confirmLabel || "Eliminar"}</span>
              </Button>
              <Button
                color="gray"
                onClick={() => {
                  if (confirmConfig.onCancel) {
                    confirmConfig.onCancel();
                  } else {
                    onClose();
                  }
                }}
              >
                {confirmConfig.cancelLabel || "Cancelar"}
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
  );
}
