import { Capacitor } from '@capacitor/core';
import Swal from 'sweetalert2';

/**
 * Cross-platform print handler.
 * On desktop browsers, uses native window.print().
 * On Capacitor (Android WebView), window.print() doesn't work,
 * so we show a helpful message guiding the user.
 */
export function handlePrint() {
  window.print();
}
