import { useState, useEffect } from "react";
import LanguageSelection from "./LanguageSelection";
import StageProgressView from "./StageProgressView";
import { languageApi } from "./services/api";

interface Language {
  id: string;
  name: string;
  description: string;
}

export default function LanguageCards() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null,
  );

  // Escuchar cambios en el idioma seleccionado desde localStorage
  useEffect(() => {
    const checkSelectedLanguage = async () => {
      const storedLanguageId = localStorage.getItem("selectedLanguageId");
      if (
        storedLanguageId &&
        (!selectedLanguage || selectedLanguage.id !== storedLanguageId)
      ) {
        // Obtener los idiomas inscritos para encontrar el idioma seleccionado
        const response = await languageApi.getEnrolledLanguages();
        if (response.success) {
          const enrolledData = response.data;
          const foundLanguage = enrolledData.data.find(
            (el: any) => el.language.id === storedLanguageId,
          )?.language;
          if (foundLanguage) {
            setSelectedLanguage(foundLanguage);
          }
        }
      }
    };

    checkSelectedLanguage();

    // Escuchar cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "selectedLanguageId") {
        checkSelectedLanguage();
      }
    };

    // Escuchar el evento personalizado userDataUpdated
    const handleUserDataUpdated = () => {
      checkSelectedLanguage();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userDataUpdated", handleUserDataUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userDataUpdated", handleUserDataUpdated);
    };
  }, [selectedLanguage]);

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
