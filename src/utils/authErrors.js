export const translateFirebaseError = (errorCode) => {
  switch (errorCode) {
    case 'auth/operation-not-allowed':
      return "Pana, el cambio de correo aún no está activo. Por favor, verifica tu cuenta primero o contacta a soporte.";
    case 'auth/email-already-in-use':
      return "Este correo ya tiene un dueño, pana. Intenta con otro.";
    case 'auth/invalid-email':
      return "Ese correo parece no estar bien escrito. ¡Revísalo!";
    case 'auth/weak-password':
      return "Esa clave está muy fácil. Ponle al menos 6 caracteres para que estés seguro.";
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return "El correo o la clave no coinciden. Inténtalo de nuevo.";
    case 'auth/requires-recent-login':
      return "Por seguridad, debes volver a iniciar sesión para hacer este cambio.";
    default:
      return "Ups, algo salió mal. Inténtalo en un ratico.";
  }
};
