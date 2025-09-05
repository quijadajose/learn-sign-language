import { useState } from "react";
import LanguageSelection from "./LanguageSelection";
import StageProgressView from "./StageProgressView";

interface Language {
  id: string;
  name: string;
  description: string;
}

export default function LanguageCards() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null,
  );

  return (
    <>
      {!selectedLanguage ? (
        <LanguageSelection onLanguageSelected={setSelectedLanguage} />
      ) : (
        <StageProgressView language={selectedLanguage} />
      )}
    </>
  );
}
