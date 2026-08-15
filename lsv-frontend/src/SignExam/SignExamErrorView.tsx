import React from "react";
import { Button, Card } from "flowbite-react";
import { HiFastForward, HiArrowLeft } from "react-icons/hi";
import { useTranslation } from "react-i18next";

type SignExamErrorViewProps = {
  error: string;
  onGoBack: () => void;
};

const SignExamErrorView: React.FC<SignExamErrorViewProps> = ({ error, onGoBack }) => {
  const { t } = useTranslation("learn");

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <div role="alert" className="text-red-500">
          <HiFastForward className="mx-auto size-16 rotate-180" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">{t("practice.errorTitle")}</h2>
          <p className="mt-2 text-gray-500">{error}</p>
        </div>
        <Button color="gray" className="mt-6" onClick={onGoBack}>
          <HiArrowLeft className="mr-2 size-5" aria-hidden />
          {t("practice.backToLesson")}
        </Button>
      </Card>
    </div>
  );
};

export default SignExamErrorView;
