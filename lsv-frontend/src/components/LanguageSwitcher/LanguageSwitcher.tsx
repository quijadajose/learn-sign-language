import {
  Modal,
  ModalHeader,
  ModalBody,
  Spinner,
  Alert,
  Tabs,
  TabItem,
} from "flowbite-react";
import { HiExclamationCircle, HiPlus, HiCollection } from "react-icons/hi";
import type { LanguageSwitcherProps } from "./types";
import { useLanguageSwitcher } from "./useLanguageSwitcher";
import EnrollLanguageTab from "./EnrollLanguageTab";
import ManageRegionsTab from "./ManageRegionsTab";

export default function LanguageSwitcher({
  isOpen,
  onClose,
  onLanguageChanged,
  initialTab = "enroll",
}: LanguageSwitcherProps) {
  const switcher = useLanguageSwitcher(
    isOpen,
    onClose,
    onLanguageChanged,
    initialTab,
  );

  return (
    <Modal show={isOpen} onClose={switcher.handleClose} size="lg" dismissible>
      <ModalHeader>Idiomas y regiones</ModalHeader>

      <ModalBody>
        {switcher.loading && (
          <div
            className="flex items-center justify-center py-8"
            role="status"
            aria-live="polite"
          >
            <Spinner size="lg" aria-hidden="true" />
            <span className="ml-2">Cargando…</span>
          </div>
        )}

        {switcher.error && (
          <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
            {switcher.error}
          </Alert>
        )}

        {!switcher.loading && !switcher.error && (
          <Tabs aria-label="Gestión de idiomas y regiones">
            <TabItem
              title="Mis idiomas"
              icon={HiCollection}
              active={switcher.activeTab === 0}
              onClick={() => switcher.setActiveTab(0)}
            >
              <ManageRegionsTab
                languages={switcher.languages}
                regions={switcher.regions}
                loading={switcher.loading}
                selectedRegionId={switcher.selectedRegionId}
                switching={switcher.switching}
                enrollingRegion={switcher.enrollingRegion}
                showRegionEnrollment={switcher.showRegionEnrollment}
                selectedLanguageForRegion={switcher.selectedLanguageForRegion}
                getEnrolledRegionsForLanguage={
                  switcher.getEnrolledRegionsForLanguage
                }
                handleRegionSelect={switcher.handleRegionSelect}
                handleEnrollInRegion={switcher.handleEnrollInRegion}
                handleEnrollRegion={switcher.handleEnrollRegion}
                handleSwitchRegion={switcher.handleSwitchRegion}
                handleUnenrollLanguage={switcher.handleUnenrollLanguage}
                handleUnenrollRegion={switcher.handleUnenrollRegion}
                handleBackFromRegionEnrollment={
                  switcher.handleBackFromRegionEnrollment
                }
                handleBackFromRegionEnrollmentNoRegions={
                  switcher.handleBackFromRegionEnrollmentNoRegions
                }
              />
            </TabItem>

            <TabItem
              title="Inscribirme"
              icon={HiPlus}
              active={switcher.activeTab === 1}
              onClick={() => switcher.setActiveTab(1)}
            >
              <EnrollLanguageTab
                regions={switcher.regions}
                selectedRegionId={switcher.selectedRegionId}
                enrolling={switcher.enrolling}
                showRegionSelection={switcher.showRegionSelection}
                selectedLanguageForEnroll={switcher.selectedLanguageForEnroll}
                getFilteredAvailableLanguages={
                  switcher.getFilteredAvailableLanguages
                }
                handleLanguageSelect={switcher.handleLanguageSelect}
                handleRegionSelect={switcher.handleRegionSelect}
                handleEnroll={switcher.handleEnroll}
                handleBack={switcher.handleBack}
                handleProceedToEnrollRegionSelection={
                  switcher.handleProceedToEnrollRegionSelection
                }
                setSelectedLanguageForEnroll={
                  switcher.setSelectedLanguageForEnroll
                }
              />
            </TabItem>
          </Tabs>
        )}
      </ModalBody>
    </Modal>
  );
}
