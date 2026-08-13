import { useState, useEffect } from "react";
import LanguageSelection from "./LanguageSelection";
import StageProgressView from "./StageProgressView";
import { languageApi } from "./services/api";
import { useLocalStorage } from "./hooks/useLocalStorage";

interface Language {
  id: string;
  name: string;
  description: string;
}

export default function LanguageCards() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null,
  );
  const [selectedLanguageId] = useLocalStorage<string | null>(
    "selectedLanguageId",
    null,
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (selectedLanguageId) {
        if (!selectedLanguage || selectedLanguage.id !== selectedLanguageId) {
          const response = await languageApi.getEnrolledLanguages();
          if (cancelled) return;
          if (response.success) {
            const enrolledData = response.data as {
              data: Array<{ language: Language }>;
            };
            const foundLanguage = enrolledData.data.find(
              (el) => el.language.id === selectedLanguageId,
            )?.language;
            if (foundLanguage) {
              setSelectedLanguage(foundLanguage);
            }
          }
        }
      } else {
        setSelectedLanguage(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedLanguageId, selectedLanguage]);

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
