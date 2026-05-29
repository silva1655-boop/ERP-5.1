const FIREBASE_MESSAGES = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/user-disabled': 'El usuario está deshabilitado.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta nuevamente más tarde.',
  'auth/network-request-failed': 'No se pudo conectar con Firebase. Revisa tu conexión.',
  'permission-denied': 'No tienes permisos para realizar esta acción.',
};

export function getFriendlyError(error) {
  const code = error?.code || error?.message;
  return FIREBASE_MESSAGES[code] || 'Ocurrió un error inesperado. Intenta nuevamente.';
}

export function handleError(error, fallback) {
  if (import.meta.env.DEV) console.error(error);
  return fallback || getFriendlyError(error);
}
