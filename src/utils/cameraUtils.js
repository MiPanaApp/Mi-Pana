import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/**
 * Tomar foto con cámara nativa o seleccionar de galería
 * @returns {Promise<{blob: Blob, webPath: string}>}
 */
export const takePicture = async () => {
  if (!Capacitor.isNativePlatform()) {
    // En web, retornar null para que use input file
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt, // Muestra: Cámara o Galería
      width: 1200,
      height: 1200,
      correctOrientation: true
    });

    // Convertir URI a Blob para subir a Firebase
    const response = await fetch(image.webPath);
    const blob = await response.blob();
    
    return {
      blob,
      webPath: image.webPath
    };
  } catch (error) {
    if (error.message && error.message.includes('User cancelled')) {
      console.log('Usuario canceló la selección');
      return null;
    }
    console.error('Error tomando foto:', error);
    throw error;
  }
};

/**
 * Seleccionar múltiples imágenes de la galería
 * @param {number} maxImages - Número máximo de imágenes
 * @returns {Promise<Array<{blob: Blob, webPath: string}>>}
 */
export const pickMultipleImages = async (maxImages = 5) => {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  const images = [];
  
  for (let i = 0; i < maxImages; i++) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos, // Solo galería
        width: 1000,
        height: 1000,
        correctOrientation: true
      });

      const response = await fetch(image.webPath);
      const blob = await response.blob();
      
      images.push({ blob, webPath: image.webPath });
      
      // Preguntar si quiere agregar más
      if (i < maxImages - 1) {
        const addMore = confirm(`Imagen ${i + 1}/${maxImages} agregada. ¿Agregar otra?`);
        if (!addMore) break;
      }
    } catch (error) {
      if (error.message && error.message.includes('User cancelled')) {
        break;
      }
      console.error('Error seleccionando imagen:', error);
      break;
    }
  }
  
  return images.length > 0 ? images : null;
};
