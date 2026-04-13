const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function updateOgImage() {
  const sourcePath = './LOGO/og-imagev2.png';
  const outputPath = './public/og-image.png';

  try {
    // Verificamos si existe el origen
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`No se encontró la imagen de origen en: ${sourcePath}`);
    }

    // Usamos sharp para asegurar que la imagen esté optimizada y tenga las medidas correctas (1200x630)
    await sharp(sourcePath)
      .resize(1200, 630)
      .toFile(outputPath);

    console.log('✅ OG Image actualizada correctamente en public/og-image.png usando el nuevo diseño.');
  } catch (err) {
    console.error('❌ Error al actualizar la OG Image:', err.message);
  }
}

updateOgImage();
