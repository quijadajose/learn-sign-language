import { useFormContext } from "react-hook-form";

import { useMultiStep } from "../../multi-step";
import { Button } from "flowbite-react";

export default function BackButton() {
  const { getValues } = useFormContext();
  const { onBack } = useMultiStep();
  return (
    <>
    <Button 
          onClick={() => onBack(getValues())}
          className="m-0 rounded-full p-0 text-white">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"  viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
      </svg>
    </Button>
      </>
  );
}
