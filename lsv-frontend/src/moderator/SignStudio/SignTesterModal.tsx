import React from "react";
import {
  Modal, ModalHeader, ModalBody, ModalFooter, Button, Spinner, Progress, Badge,
} from "flowbite-react";
import { HiExclamation } from "react-icons/hi";
import { REST_FRAMES_TO_START } from "../../utils/signDetection";
import { useSignTester, type SignTesterModel } from "./useSignTester";

interface SignTesterModalProps {
  show: boolean;
  onClose: () => void;
  model: SignTesterModel | null;
}

const SignTesterModal: React.FC<SignTesterModalProps> = ({ show, onClose, model }) => {
  const {
    videoRef, canvasRef, isLoading, error, prediction, capturePhase,
    restFrameCount, movementFrameCount, handVisible, modelType, isMediaPipeReady, handleClose,
  } = useSignTester(show, model, onClose);

  return (
<Modal show={show} onClose={handleClose} size="4xl">
      <ModalHeader>
        Prueba de Modelo: <span className="text-blue-500">{model?.name}</span>
      </ModalHeader>
      <ModalBody>
        {isLoading ? (
          <div className="flex h-96 flex-col items-center justify-center space-y-4">
            <Spinner size="xl" />
            <p className="text-gray-500">
              Cargando modelos y preparando cámara...
            </p>
          </div>
        ) : error ? (
          <div className="flex h-96 flex-col items-center justify-center space-y-4 text-red-500">
            <HiExclamation size={64} />
            <p className="font-medium">{error}</p>
            <Button color="gray" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="mirror absolute inset-0 size-full object-cover opacity-40"
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="mirror absolute inset-0 size-full object-cover"
              />
              {!isMediaPipeReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Spinner size="lg" />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Estado de captura
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {capturePhase === "waiting" &&
                      "Esperando reposo / mano visible"}
                    {capturePhase === "arming" &&
                      `Armando… ${restFrameCount}/${REST_FRAMES_TO_START}`}
                    {capturePhase === "stabilizing" && "Estabilizando…"}
                    {capturePhase === "collecting" &&
                      (modelType === "static"
                        ? "Capturando seña estática"
                        : `Capturando gesto… ${movementFrameCount} frames`)}
                    {capturePhase === "analyzing" && "Analizando…"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Mano: {handVisible ? "visible" : "no detectada"} · Tipo:{" "}
                    {modelType}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Predicción
                  </p>
                  {prediction ? (
                    <>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {prediction.label}
                      </p>
                      <Progress
                        progress={Math.round(prediction.confidence * 100)}
                        color={prediction.confidence > 0.8 ? "green" : "yellow"}
                        size="lg"
                      />
                    </>
                  ) : (
                    <p className="text-sm italic text-gray-400">
                      Sin predicción aún
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:text-left">
                    Clases del modelo
                  </h4>
                  <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                    {model?.labels?.map((l) => (
                      <Badge
                        key={l}
                        color={prediction?.label === l ? "info" : "gray"}
                        className="px-2 py-1"
                      >
                        {l}
                      </Badge>
                    )) || (
                      <p className="text-xs italic text-gray-400">
                        No hay etiquetas disponibles
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={handleClose}>
          Cerrar Prueba
        </Button>
      </ModalFooter>
      <style>{`
        .mirror { transform: scaleX(-1); }
      `}</style>
    </Modal>
  );
};

export default SignTesterModal;
