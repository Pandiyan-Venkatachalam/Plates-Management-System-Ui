/**
 * Cross-platform print handler.
 * On desktop browsers, uses native window.print().
 * On Capacitor (Android WebView), window.print() is handled gracefully.
 */
export function handlePrint(): void {
  window.print();
}
