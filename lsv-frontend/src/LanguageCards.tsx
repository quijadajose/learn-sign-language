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
    const fetchSelectedLanguage = async () => {
      if (selectedLanguageId) {
        if (!selectedLanguage || selectedLanguage.id !== selectedLanguageId) {
          const response = await languageApi.getEnrolledLanguages();
          if (response.success) {
            const enrolledData = response.data;
            const foundLanguage = enrolledData.data.find(
              (el: any) => el.language.id === selectedLanguageId,
            )?.language;
            if (foundLanguage) {
              setSelectedLanguage(foundLanguage);
            }
          }
        }
      } else {
        setSelectedLanguage(null);
      }
    };

    fetchSelectedLanguage();
  }, [selectedLanguageId]);

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
