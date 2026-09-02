import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

const SERVER_ID = 'vinayaga-plates-app';
const METADATA_KEY = 'vpms_biometric_metadata';

export const biometricService = {
  // Checks if the native biometric hardware is available
  async checkAvailability() {
    if (!Capacitor.isNativePlatform()) {
      return { isAvailable: false, hasCredentials: false, configuredUsername: null };
    }
    try {
      const result = await NativeBiometric.isAvailable();
      const isAvailable = !!result.isAvailable;
      
      // Check if credentials are set in metadata
      const metadataStr = localStorage.getItem(METADATA_KEY);
      let hasCredentials = false;
      let configuredUsername = null;
      if (metadataStr) {
        try {
          const metadata = JSON.parse(metadataStr);
          hasCredentials = !!metadata.biometricEnabled;
          configuredUsername = metadata.username;
        } catch (e) {
          localStorage.removeItem(METADATA_KEY);
        }
      }
      
      return { isAvailable, hasCredentials, configuredUsername };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return { isAvailable: false, hasCredentials: false, configuredUsername: null };
    }
  },

  // Save secure credentials and update local metadata
  async saveCredentials(username, password) {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      // First, prompt native biometric verification to authorize saving
      await NativeBiometric.verifyIdentity({
        reason: "Confirm your identity to enable biometric login",
        title: "Enable Biometric Login",
        subtitle: "Vinayaga Plates",
        description: "Verify your identity using biometric authentication",
      });

      // Securely store credentials in Android Keystore / iOS Keychain
      await NativeBiometric.setCredentials({
        username,
        password,
        server: SERVER_ID,
      });

      // Save local non-sensitive metadata for account protection
      localStorage.setItem(METADATA_KEY, JSON.stringify({
        biometricEnabled: true,
        username: username
      }));
      return true;
    } catch (error) {
      console.error('Error saving biometric credentials:', error);
      throw error;
    }
  },

  // Retrieve credentials securely
  async getCredentials() {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      // First authenticate the user
      await NativeBiometric.verifyIdentity({
        reason: "Scan your fingerprint to log in",
        title: "Biometric Verification",
        subtitle: "Vinayaga Plates",
        description: "Verify your identity using biometric authentication",
      });

      // Fetch securely stored credentials
      const credentials = await NativeBiometric.getCredentials({
        server: SERVER_ID,
      });
      return credentials; // contains { username, password }
    } catch (error) {
      console.error('Error retrieving biometric credentials:', error);
      throw error;
    }
  },

  // Delete credentials
  async deleteCredentials() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await NativeBiometric.deleteCredentials({
        server: SERVER_ID,
      });
    } catch (error) {
      console.warn('Error deleting credentials from keystore:', error);
    } finally {
      // Always reset local metadata
      localStorage.removeItem(METADATA_KEY);
    }
  }
};
