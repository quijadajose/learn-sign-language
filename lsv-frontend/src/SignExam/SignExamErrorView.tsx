import React from "react";
import { Button, Card } from "flowbite-react";
import { HiFastForward, HiArrowLeft } from "react-icons/hi";

type SignExamErrorViewProps = {
  error: string;
  onGoBack: () => void;
};

const SignExamErrorView: React.FC<SignExamErrorViewProps> = ({ error, onGoBack }) => {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <div className="text-red-500">
          <HiFastForward className="mx-auto size-16 rotate-180" />
          <h2 className="mt-4 text-xl font-bold">Ups, algo salió mal</h2>
          <p className="mt-2 text-gray-500">{error}</p>
        </div>
        <Button color="gray" className="mt-6" onClick={onGoBack}>
          <HiArrowLeft className="mr-2 size-5" />
          Volver a la lección
        </Button>
      </Card>
    </div>
  );
};

export default SignExamErrorView;
