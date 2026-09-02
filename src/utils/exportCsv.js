import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Utility to download CSV for both Web and Native (Android/iOS) via Capacitor
 * @param {string} csvContent The raw CSV text content
 * @param {string} filename The name of the file (e.g. 'Report_2024.csv')
 */
export const downloadCsvCrossPlatform = async (csvContent, filename) => {
  const isMobile = Capacitor.isNativePlatform();

  if (isMobile) {
    try {
      // 1. Write the file to Cache directory natively
      const result = await Filesystem.writeFile({
        path: filename,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      // 2. Open the native Share/Save dialog so the user can save to Downloads or share it
      await Share.share({
        title: filename,
        text: 'Exported CSV Data',
        url: result.uri,
        dialogTitle: 'Save or Share CSV',
      });
    } catch (error) {
      console.error('Error saving or sharing CSV on native:', error);
      alert('Failed to save CSV file. Please check permissions.');
    }
  } else {
    // Standard web browser download using Blob URL
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
