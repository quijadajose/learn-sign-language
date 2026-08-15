export type AppLocale = 'es' | 'en';

export const DEFAULT_LOCALE: AppLocale = 'es';

/** Nested message catalogs keyed by dotted paths (e.g. errors.auth.invalidCredentials). */
export type MessageTree = { [key: string]: string | MessageTree };

export const messages: Record<AppLocale, MessageTree> = {
  es: {
    errors: {
      auth: {
        invalidCredentials: 'Credenciales inválidas',
        invalidOrExpiredToken: 'Token inválido o expirado',
        tokenExpired: 'El token ha expirado',
        invalidToken: 'Token inválido',
        emailInUse: 'El correo ya está en uso',
        currentPasswordMismatch: 'La contraseña actual no coincide',
        newPasswordSameAsOld:
          'La nueva contraseña debe ser distinta a la anterior',
        noToken: 'No se proporcionó un token',
        noUserData: 'No se encontraron datos de usuario',
        invalidOAuthCode: 'Código OAuth inválido o expirado',
        passwordResetFailed: 'No se pudo restablecer la contraseña',
      },
      user: {
        notFound: 'Usuario no encontrado',
        notEnrolledLanguage: 'No estás inscrito en este idioma.',
        lastLanguage:
          'No puedes desinscribirte del último idioma. Debes tener al menos un idioma inscrito.',
      },
      language: {
        notFound: 'Idioma no encontrado',
        alreadyExists: 'Ya existe un idioma con este nombre',
        alreadyInUse: 'El idioma ya está en uso',
        idRequired: 'Se debe proporcionar un ID',
      },
      lesson: {
        notFound: 'Lección no encontrada',
        alreadyInUse: 'La lección ya está en uso',
        idRequired: 'lessonId es obligatorio',
        variantNotFound: 'Variante de lección no encontrada',
        baseVariantExists:
          'Ya existe una variante base para esta lección. Solo puede haber una variante base por lección.',
        regionVariantExists:
          'Ya existe una variante para esta región en esta lección.',
      },
      stage: {
        notFound: 'Etapa no encontrada',
        alreadyInUse: 'La etapa ya está en uso',
      },
      region: {
        notFound: 'Región no encontrada',
        notEnrolled: 'No estás inscrito en esta región.',
        alreadyExists: 'Ya existe una región con este código',
        defaultExists:
          'Ya existe una región base para este idioma ({name}). Solo puede haber una región base por idioma.',
        cannotDeleteDefault: 'No se puede eliminar la región base',
        languageRequired: 'languageId es obligatorio para crear una región',
        noLanguagesToAssign:
          'No hay idiomas disponibles para asignar a regiones',
      },
      quiz: {
        notFound: 'Quiz no encontrado',
        userIdMissing: 'Falta el ID de usuario en la solicitud.',
        userAndQuizRequired: 'Se requieren el ID de usuario y el ID del quiz.',
        variantNotFound: 'Variante de quiz no encontrada',
        orLessonNotFound: 'Quiz o lección no encontrado',
        variantOrLessonVariantNotFound:
          'Variante de quiz o de lección no encontrada',
      },
      sign: {
        notFound: 'Seña no encontrada',
        nameRequired: 'El nombre es obligatorio',
        languageIdRequired: 'languageId es obligatorio',
        signsEmpty: 'La lista de señas no puede estar vacía',
        nameOrDetectionTypeRequired:
          'Debes enviar al menos name o detectionType',
      },
      recording: {
        notFound: 'Grabación no encontrada',
      },
      model: {
        notFound: 'Modelo no encontrado',
        lessonModelNotFound: 'Modelo de lección no encontrado',
        insufficientTrainingData: 'No hay datos suficientes para entrenar',
        noTrainedModel: 'No se encontró un modelo entrenado para esta lección',
        noValidatedRecordings:
          'No hay grabaciones validadas para entrenar esta lección',
        noStaticOrDynamicRecordings:
          'No hay grabaciones estáticas ni dinámicas para entrenar',
        noValidRecordingsForDual:
          'No hay grabaciones válidas para entrenar modelos estáticos o dinámicos',
        invalidTrainerPayload: 'Resultado del entrenador inválido: {details}',
        hashMismatch: 'El hash SHA-256 de model.json no coincide',
        untrustedModelUrl: 'URL de modelo no permitida',
      },
      landmarks: {
        empty:
          'Landmarks inválidos: se requiere al menos un frame de {count} features',
        invalidLength:
          'Landmarks inválidos en frame {index}: se esperaban {expected} features, se recibieron {received}',
        invalidNumbers:
          'Landmarks inválidos en frame {index}: todos los valores deben ser números finitos',
      },
      image: {
        notFound: 'Imagen no encontrada',
        noImageReceived: 'No se recibió ninguna imagen',
        noImageBuffer: 'No hay buffer de imagen disponible',
        invalidFolder: 'Nombre de carpeta de carga inválido',
        invalidDirectory: 'Directorio de carga inválido',
        invalidFolderAllowed:
          'Carpeta de carga inválida. Permitidas: {folders}',
        unsupportedFormat:
          'Formato de imagen no soportado. Use PNG, JPEG o WebP',
        sharpFailed: 'No se pudo procesar la imagen con Sharp',
        processingFailed:
          'Error procesando la imagen. Verifique que sea un archivo de imagen válido',
        noFile: 'No se subió ningún archivo',
        onlyImages: 'Solo se permiten archivos de imagen',
      },
      permission: {
        notFound: 'Permiso no encontrado',
        invalidScope: 'Ámbito inválido',
        unauthenticated: 'Usuario no autenticado',
        resourceIdNotFound: 'No se encontró el ID del recurso',
        languageAccessDenied:
          'No tienes permiso para acceder a este recurso de idioma',
        regionLanguageNotFound: 'No se encontró el idioma de la región',
        regionAccessDenied:
          'No tienes permiso para acceder a este recurso de región',
        verifyFailed: 'Error al verificar permisos de región',
        alreadyHasLanguage: 'El usuario ya tiene permiso para este idioma',
        alreadyHasRegion: 'El usuario ya tiene permiso para esta región',
      },
      country: {
        notFound: 'País no encontrado',
        alreadyExists: 'Ya existe un país con este código',
      },
      division: {
        notFound: 'División no encontrada',
        alreadyExists: 'Ya existe una división con este código',
      },
      validation: {
        searchTermRequired: 'El término de búsqueda es obligatorio',
        searchTermString: 'El término de búsqueda debe ser texto',
        searchTermMin:
          'El término de búsqueda debe tener al menos 2 caracteres',
      },
      common: {
        forbidden: 'Prohibido',
        forbiddenResource: 'Recurso prohibido',
        unauthorized: 'No autorizado',
        tooManyRequests: 'Demasiadas solicitudes',
      },
    },
    success: {
      auth: {
        registered: 'Usuario registrado correctamente',
        loggedIn: 'Inicio de sesión exitoso',
        resetLinkSent:
          'Si el correo existe, se ha enviado un enlace de restablecimiento.',
        passwordReset: 'La contraseña se restableció correctamente',
        loggedOut: 'Sesión cerrada',
      },
      quizVariantDeleted: 'Variante de quiz eliminada correctamente',
      lessonVariantDeleted: 'Variante de lección eliminada correctamente',
      imageUploaded: 'Imagen subida correctamente',
      permissionRevoked: 'Permiso revocado correctamente',
      unenrolledLanguage: 'Te has desinscrito del idioma exitosamente.',
      unenrolledRegion: 'Te has desinscrito de la región exitosamente.',
      languageAssignedToRegions: 'Idioma asignado a {count} regiones',
    },
  },
  en: {
    errors: {
      auth: {
        invalidCredentials: 'Invalid credentials',
        invalidOrExpiredToken: 'Invalid or expired token',
        tokenExpired: 'Token has expired',
        invalidToken: 'Invalid token',
        emailInUse: 'Email already in use',
        currentPasswordMismatch: 'Current password does not match',
        newPasswordSameAsOld:
          'New password must be different from the old password',
        noToken: 'No token provided',
        noUserData: 'No user data found',
        invalidOAuthCode: 'Invalid or expired OAuth code',
        passwordResetFailed: 'Password reset failed',
      },
      user: {
        notFound: 'User not found',
        notEnrolledLanguage: 'You are not enrolled in this language.',
        lastLanguage:
          'You cannot unenroll from your last language. You must stay enrolled in at least one language.',
      },
      language: {
        notFound: 'Language not found',
        alreadyExists: 'Language with this name already exists',
        alreadyInUse: 'Language already in use',
        idRequired: 'ID must be provided',
      },
      lesson: {
        notFound: 'Lesson not found',
        alreadyInUse: 'Lesson already in use',
        idRequired: 'lessonId is required',
        variantNotFound: 'Lesson variant not found',
        baseVariantExists:
          'A base variant already exists for this lesson. Only one base variant is allowed per lesson.',
        regionVariantExists:
          'A variant already exists for this region in this lesson.',
      },
      stage: {
        notFound: 'Stage not found',
        alreadyInUse: 'Stage already in use',
      },
      region: {
        notFound: 'Region not found',
        notEnrolled: 'You are not enrolled in this region.',
        alreadyExists: 'A region with this code already exists',
        defaultExists:
          'A default region already exists for this language ({name}). Only one default region is allowed per language.',
        cannotDeleteDefault: 'Cannot delete the default region',
        languageRequired: 'languageId is required to create a region',
        noLanguagesToAssign: 'No languages available to assign to regions',
      },
      quiz: {
        notFound: 'Quiz not found',
        userIdMissing: 'User ID is missing from the request.',
        userAndQuizRequired: 'User ID and Quiz ID are required.',
        variantNotFound: 'Quiz variant not found',
        orLessonNotFound: 'Quiz or lesson not found',
        variantOrLessonVariantNotFound:
          'Quiz variant or lesson variant not found',
      },
      sign: {
        notFound: 'Sign not found',
        nameRequired: 'Name is required',
        languageIdRequired: 'languageId is required',
        signsEmpty: 'signs must not be empty',
        nameOrDetectionTypeRequired:
          'You must send at least name or detectionType',
      },
      recording: {
        notFound: 'Recording not found',
      },
      model: {
        notFound: 'Model not found',
        lessonModelNotFound: 'Lesson model not found',
        insufficientTrainingData: 'Not enough data to train',
        noTrainedModel: 'No trained model was found for this lesson',
        noValidatedRecordings:
          'There are no validated recordings to train this lesson',
        noStaticOrDynamicRecordings:
          'There are no static or dynamic recordings to train',
        noValidRecordingsForDual:
          'There are no valid recordings to train static or dynamic models',
        invalidTrainerPayload: 'Invalid trainer result payload: {details}',
        hashMismatch: 'model.json SHA-256 does not match',
        untrustedModelUrl: 'Untrusted model URL',
      },
      landmarks: {
        empty:
          'Invalid landmarks: at least one frame of {count} features is required',
        invalidLength:
          'Invalid landmarks in frame {index}: expected {expected} features, received {received}',
        invalidNumbers:
          'Invalid landmarks in frame {index}: all values must be finite numbers',
      },
      image: {
        notFound: 'Image not found',
        noImageReceived: 'No image received',
        noImageBuffer: 'No image buffer available',
        invalidFolder: 'Invalid upload folder name',
        invalidDirectory: 'Invalid upload directory',
        invalidFolderAllowed: 'Invalid upload folder. Allowed: {folders}',
        unsupportedFormat: 'Unsupported image format. Use PNG, JPEG or WebP',
        sharpFailed: 'Could not process the image with Sharp',
        processingFailed:
          'Error processing the image. Make sure it is a valid image file',
        noFile: 'No file uploaded',
        onlyImages: 'Only image files are allowed',
      },
      permission: {
        notFound: 'Permission not found',
        invalidScope: 'Invalid scope',
        unauthenticated: 'User not authenticated',
        resourceIdNotFound: 'Resource ID not found',
        languageAccessDenied:
          'You do not have permission to access this language resource',
        regionLanguageNotFound: 'Region language not found',
        regionAccessDenied:
          'You do not have permission to access this region resource',
        verifyFailed: 'Error verifying region permissions',
        alreadyHasLanguage: 'User already has permission for this language',
        alreadyHasRegion: 'User already has permission for this region',
      },
      country: {
        notFound: 'Country not found',
        alreadyExists: 'A country with this code already exists',
      },
      division: {
        notFound: 'Division not found',
        alreadyExists: 'A division with this code already exists',
      },
      validation: {
        searchTermRequired: 'Search term is required',
        searchTermString: 'Search term must be a string',
        searchTermMin: 'Search term must be at least 2 characters long',
      },
      common: {
        forbidden: 'Forbidden',
        forbiddenResource: 'Forbidden resource',
        unauthorized: 'Unauthorized',
        tooManyRequests: 'Too Many Requests',
      },
    },
    success: {
      auth: {
        registered: 'User registered successfully',
        loggedIn: 'User logged in successfully',
        resetLinkSent: 'If the email exists, a reset link has been sent.',
        passwordReset: 'Password has been successfully reset.',
        loggedOut: 'Logged out',
      },
      quizVariantDeleted: 'Quiz variant deleted successfully',
      lessonVariantDeleted: 'Lesson variant deleted successfully',
      imageUploaded: 'Image uploaded successfully',
      permissionRevoked: 'Permission revoked successfully',
      unenrolledLanguage: 'You have unenrolled from the language successfully.',
      unenrolledRegion: 'You have unenrolled from the region successfully.',
      languageAssignedToRegions: 'Language assigned to {count} regions',
    },
  },
};

/** Maps legacy hardcoded messages to i18n keys so both old and new throws work. */
export const legacyMessageToKey: Record<string, string> = {
  'Invalid credentials': 'errors.auth.invalidCredentials',
  'Invalid or expired token': 'errors.auth.invalidOrExpiredToken',
  'Token has expired': 'errors.auth.tokenExpired',
  'Invalid token': 'errors.auth.invalidToken',
  'Email already in use': 'errors.auth.emailInUse',
  'Current password does not match': 'errors.auth.currentPasswordMismatch',
  'New password must be different from the old password':
    'errors.auth.newPasswordSameAsOld',
  'No token provided': 'errors.auth.noToken',
  'No user data found': 'errors.auth.noUserData',
  'Invalid or expired OAuth code': 'errors.auth.invalidOAuthCode',
  'Password reset failed': 'errors.auth.passwordResetFailed',
  'User not found': 'errors.user.notFound',
  'No estás inscrito en este idioma.': 'errors.user.notEnrolledLanguage',
  'No puedes desinscribirte del último idioma. Debes tener al menos un idioma inscrito.':
    'errors.user.lastLanguage',
  'Language not found': 'errors.language.notFound',
  'Language with this name already exists': 'errors.language.alreadyExists',
  'Language already in use': 'errors.language.alreadyInUse',
  'ID must be provided': 'errors.language.idRequired',
  'Lesson not found': 'errors.lesson.notFound',
  'Lección no encontrada': 'errors.lesson.notFound',
  'Lesson already in use': 'errors.lesson.alreadyInUse',
  'lessonId is required': 'errors.lesson.idRequired',
  'Lesson variant not found': 'errors.lesson.variantNotFound',
  'Ya existe una variante base para esta lección. Solo puede haber una variante base por lección.':
    'errors.lesson.baseVariantExists',
  'Ya existe una variante para esta región en esta lección.':
    'errors.lesson.regionVariantExists',
  'Stage not found': 'errors.stage.notFound',
  'Stage already in use': 'errors.stage.alreadyInUse',
  'Region not found': 'errors.region.notFound',
  'No estás inscrito en esta región.': 'errors.region.notEnrolled',
  'Cannot delete the default region': 'errors.region.cannotDeleteDefault',
  'languageId is required to create a region': 'errors.region.languageRequired',
  'No languages available to assign to regions':
    'errors.region.noLanguagesToAssign',
  'Quiz not found': 'errors.quiz.notFound',
  'User ID is missing from the request.': 'errors.quiz.userIdMissing',
  'User ID and Quiz ID are required.': 'errors.quiz.userAndQuizRequired',
  'Quiz variant not found': 'errors.quiz.variantNotFound',
  'Quiz or lesson not found': 'errors.quiz.orLessonNotFound',
  'Quiz variant or lesson variant not found':
    'errors.quiz.variantOrLessonVariantNotFound',
  'Sign not found': 'errors.sign.notFound',
  'Seña no encontrada': 'errors.sign.notFound',
  'Name is required': 'errors.sign.nameRequired',
  'languageId is required': 'errors.sign.languageIdRequired',
  'signs must not be empty': 'errors.sign.signsEmpty',
  'Debes enviar al menos name o detectionType':
    'errors.sign.nameOrDetectionTypeRequired',
  'Recording not found': 'errors.recording.notFound',
  'Grabación no encontrada': 'errors.recording.notFound',
  'Model not found': 'errors.model.notFound',
  'Modelo no encontrado': 'errors.model.notFound',
  'Lesson model not found': 'errors.model.lessonModelNotFound',
  'No hay datos suficientes para entrenar':
    'errors.model.insufficientTrainingData',
  'No se encontró un modelo entrenado para esta lección':
    'errors.model.noTrainedModel',
  'No hay grabaciones validadas para entrenar esta lección':
    'errors.model.noValidatedRecordings',
  'No hay grabaciones estáticas ni dinámicas para entrenar':
    'errors.model.noStaticOrDynamicRecordings',
  'No hay grabaciones válidas para entrenar modelos estáticos o dinámicos':
    'errors.model.noValidRecordingsForDual',
  'Image not found': 'errors.image.notFound',
  'No image received': 'errors.image.noImageReceived',
  'No image buffer available': 'errors.image.noImageBuffer',
  'Invalid upload folder name': 'errors.image.invalidFolder',
  'Invalid upload directory': 'errors.image.invalidDirectory',
  'Formato de imagen no soportado. Use PNG, JPEG o WebP':
    'errors.image.unsupportedFormat',
  'No se pudo procesar la imagen con Sharp': 'errors.image.sharpFailed',
  'Error procesando la imagen. Verifique que sea un archivo de imagen válido':
    'errors.image.processingFailed',
  'No file uploaded': 'errors.image.noFile',
  'Only image files are allowed!': 'errors.image.onlyImages',
  'Permission not found': 'errors.permission.notFound',
  'Invalid scope': 'errors.permission.invalidScope',
  'User not authenticated': 'errors.permission.unauthenticated',
  'Resource ID not found': 'errors.permission.resourceIdNotFound',
  'You do not have permission to access this language resource':
    'errors.permission.languageAccessDenied',
  'Region language not found': 'errors.permission.regionLanguageNotFound',
  'You do not have permission to access this region resource':
    'errors.permission.regionAccessDenied',
  'Error verifying region permissions': 'errors.permission.verifyFailed',
  'User already has permission for this language':
    'errors.permission.alreadyHasLanguage',
  'User already has permission for this region':
    'errors.permission.alreadyHasRegion',
  Forbidden: 'errors.common.forbidden',
  'Forbidden resource': 'errors.common.forbiddenResource',
  Unauthorized: 'errors.common.unauthorized',
  'Too Many Requests': 'errors.common.tooManyRequests',
  'ThrottlerException: Too Many Requests': 'errors.common.tooManyRequests',
  'Search term is required': 'errors.validation.searchTermRequired',
  'Search term must be a string': 'errors.validation.searchTermString',
  'Search term must be at least 2 characters long':
    'errors.validation.searchTermMin',
  'User registered successfully': 'success.auth.registered',
  'User logged in successfully': 'success.auth.loggedIn',
  'If the email exists, a reset link has been sent.':
    'success.auth.resetLinkSent',
  'Password has been successfully reset.': 'success.auth.passwordReset',
  'Quiz variant deleted successfully': 'success.quizVariantDeleted',
  'Lesson variant deleted successfully': 'success.lessonVariantDeleted',
  'Image uploaded successfully': 'success.imageUploaded',
  'Permission revoked successfully': 'success.permissionRevoked',
  'Te has desinscrito del idioma exitosamente.': 'success.unenrolledLanguage',
  'Te has desinscrito de la región exitosamente.': 'success.unenrolledRegion',
};
