// emf-converter.js — модуль для конвертации EMF/WMF в PNG
import { convertEmfToDataUrl, convertWmfToDataUrl } from 'https://cdn.jsdelivr.net/npm/emf-converter@2.0.2/+esm';

/**
 * Проходит по всем <img> внутри контейнера и пытается конвертировать EMF/WMF.
 * @param {HTMLElement} container — элемент, внутри которого ищем картинки.
 */
async function convertEmfImages(container) {
  if (!container) return;
  const imgs = container.querySelectorAll('img');
  for (const img of imgs) {
    // Нас интересуют только blob-URL (так docx-preview отдаёт встроенные картинки)
    if (!img.src.startsWith('blob:')) continue;
    try {
      const response = await fetch(img.src);
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Проверка сигнатуры EMF: первые 4 байта — 01 00 00 00
      if (bytes[0] === 0x01 && bytes[1] === 0x00 && bytes[2] === 0x00 && bytes[3] === 0x00) {
        const pngUrl = await convertEmfToDataUrl(buffer);
        img.src = pngUrl;
        console.log('EMF сконвертирован:', img.alt || '(без имени)');
      }
      // Проверка сигнатуры WMF: D7 CD C6 9A (placeable) или 01 00 09 00 (standard)
      else if (
        (bytes[0] === 0xD7 && bytes[1] === 0xCD && bytes[2] === 0xC6 && bytes[3] === 0x9A) ||
        (bytes[0] === 0x01 && bytes[1] === 0x00 && bytes[2] === 0x09 && bytes[3] === 0x00)
      ) {
        const pngUrl = await convertWmfToDataUrl(buffer);
        img.src = pngUrl;
        console.log('WMF сконвертирован:', img.alt || '(без имени)');
      }
    } catch (e) {
      console.warn('Не удалось сконвертировать изображение:', e);
    }
  }
}

// Делаем функцию доступной из основного скрипта
window.convertEmfImages = convertEmfImages;