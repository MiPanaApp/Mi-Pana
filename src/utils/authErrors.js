export const translateFirebaseError = (errorCode) => {
  switch (errorCode) {
    // Firebase v10+ unified credential error
    case 'auth/invalid-credential':
      return "El correo o la clave no coinciden. Inténtalo de nuevo.";
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
    case 'auth/too-many-requests':
      return "Demasiados intentos fallidos. Espera un momento antes de intentar de nuevo.";
    case 'auth/user-disabled':
      return "Esta cuenta ha sido desactivada. Contacta a soporte para más información.";
    case 'auth/requires-recent-login':
      return "Por seguridad, debes volver a iniciar sesión para hacer este cambio.";
    case 'auth/popup-closed-by-user':
      return "Se cerró la ventana de inicio de sesión. Inténtalo de nuevo.";
    case 'auth/network-request-failed':
      return "Error de conexión. Verifica tu internet e inténtalo de nuevo.";
    case 'auth/credential-already-in-use':
      return "Estas credenciales ya están asociadas a otra cuenta.";
    default:
      console.warn("Unhandled Firebase auth error code:", errorCode);
      return "Ups, algo salió mal. Inténtalo en un ratico.";
  }
};
