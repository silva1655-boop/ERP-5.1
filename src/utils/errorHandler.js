const FIREBASE_MESSAGES = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No existe un usuario de Firebase Authentication con ese correo.',
  'auth/user-disabled': 'El usuario está deshabilitado.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta nuevamente más tarde.',
  'auth/network-request-failed': 'No se pudo conectar con Firebase. Revisa tu conexión.',
  'auth/invalid-email': 'El correo ingresado no es válido.',
  'auth/unauthorized-domain': 'El dominio del despliegue no está autorizado en Firebase Authentication.',
  'permission-denied': 'No se pudo leer tu perfil en Firestore. Publica las reglas actualizadas y verifica que exista companies/{companyId}/users/{uid}.',
  'profile-not-found': 'Autenticación correcta, pero no existe un perfil Firestore para este UID.',
  'invalid-argument': 'La configuración del perfil está incompleta. Verifica el campo companyId del usuario en Firestore.',
};

export function getFriendlyError(error) {
  const code = error?.code || error?.message;
  return FIREBASE_MESSAGES[code] || error?.message || 'Ocurrió un error inesperado. Intenta nuevamente.';
}

export function handleError(error, fallback) {
  if (import.meta.env.DEV) console.error(error);
  return fallback || getFriendlyError(error);
}
