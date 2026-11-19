/**
 * Migraciones registradas como clases, no como glob.
 *
 * Con un glob, TypeORM las carga con un `import()` dinámico que el runtime ESM de
 * Jest no puede resolver después de la primera suite e2e del mismo proceso.
 * Al crear una migración nueva, agrégala aquí (migrations.spec.ts lo verifica).
 */
import { InitialSchema1773939643549 } from './migrations/1773939643549-InitialSchema.js';
import { AddSignAndLessonModel1777142219660 } from './migrations/1777142219660-AddSignAndLessonModel.js';
import { AddLessonIdToLessonModel1778000000000 } from './migrations/1778000000000-AddLessonIdToLessonModel.js';
import { AddRecordingValidationAndSignDetectionType1778100000000 } from './migrations/1778100000000-AddRecordingValidationAndSignDetectionType.js';
import { AddModelTypeToLessonModel1778200000000 } from './migrations/1778200000000-AddModelTypeToLessonModel.js';
import { AddFeaturesSchemaVersionToLessonModel1778300000000 } from './migrations/1778300000000-AddFeaturesSchemaVersionToLessonModel.js';
import { AddLessonModelLessonIdIndex1778400000000 } from './migrations/1778400000000-AddLessonModelLessonIdIndex.js';
import { AddLanguageIdToSign1778500000000 } from './migrations/1778500000000-AddLanguageIdToSign.js';
import { AddPerformanceIndexes1778600000000 } from './migrations/1778600000000-AddPerformanceIndexes.js';
import { AddUserTokenVersion1778700000000 } from './migrations/1778700000000-AddUserTokenVersion.js';
import { AddUniqueLowerEmailIndex1778800000000 } from './migrations/1778800000000-AddUniqueLowerEmailIndex.js';

export const migrations = [
  InitialSchema1773939643549,
  AddSignAndLessonModel1777142219660,
  AddLessonIdToLessonModel1778000000000,
  AddRecordingValidationAndSignDetectionType1778100000000,
  AddModelTypeToLessonModel1778200000000,
  AddFeaturesSchemaVersionToLessonModel1778300000000,
  AddLessonModelLessonIdIndex1778400000000,
  AddLanguageIdToSign1778500000000,
  AddPerformanceIndexes1778600000000,
  AddUserTokenVersion1778700000000,
  AddUniqueLowerEmailIndex1778800000000,
];
