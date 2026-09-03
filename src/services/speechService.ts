import * as Speech from 'expo-speech';

/**
 * Voice announcement helper specifically tuned for seniors.
 * Uses a slower rate (85%) and warmer tone for clear comprehension.
 */
export const announceMedication = (pillName: string, dosage: string): void => {
  // Stop any ongoing speech playback before starting a new one
  Speech.stop();

  // Natural senior-friendly reminder message
  const message = `Attention: It is time to take your medicine. Please take ${pillName}, dose: ${dosage}.`;

  Speech.speak(message, {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.85, // Slower rate (85%) for seniors to understand clearly
  });
};
