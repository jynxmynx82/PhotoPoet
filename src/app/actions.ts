
'use server';

import { generatePoem, type GeneratePoemInput } from '@/ai/flows/generate-poem';
import { customizePoemTone, type CustomizePoemToneInput } from '@/ai/flows/customize-poem-tone';
import { textToSpeech, type TextToSpeechInput } from '@/ai/flows/text-to-speech';
import { generateImage, type GenerateImageInput } from '@/ai/flows/generate-image';
import { testVoice, type TestVoiceInput } from '@/ai/flows/test-voice';

interface GenerateResult {
  poem?: string;
  error?: string;
}

interface CustomizeResult {
  revisedPoem?: string;
  error?: string;
}

interface TextToSpeechResult {
    audioDataUri?: string;
    error?: string;
}

interface GenerateImageResult {
    imageDataUri?: string;
    error?: string;
}

interface TestVoiceResult {
    audioDataUri?: string;
    error?: string;
}

// Helper function to create more user-friendly error messages
const getFriendlyErrorMessage = (error: any, context: 'poem' | 'image' | 'audio' | 'revision' | 'voice_test'): string => {
    console.error(`Error in ${context} generation:`, error);
    const rawMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

    if (rawMessage.includes('Deadline exceeded') || rawMessage.includes('504')) {
        return 'The AI is taking a bit too long to respond. Please try again in a moment.';
    }
    if (rawMessage.includes('safety policy')) {
        return 'The request was blocked by the content safety filter. Please adjust your prompt or image and try again.';
    }
     if (rawMessage.includes('API key not valid')) {
        return 'The server is not configured correctly. Please contact support.';
    }
    if (rawMessage.match(/server error|500|503/i)) {
        return 'The AI service is currently unavailable. Please try again later.';
    }

    // Default friendly message
    switch(context) {
        case 'image':
            return 'An unexpected error occurred while creating your image. Please try again.';
        case 'poem':
            return 'An unexpected error occurred while generating your poem. Please try again.';
        case 'audio':
            return 'An unexpected error occurred while generating the audio. Please try again.';
        case 'revision':
            return 'An unexpected error occurred while revising the poem. Please try again.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
};


export async function generatePoemAction(input: GeneratePoemInput): Promise<GenerateResult> {
  if (!input.photoDataUri) {
    return { error: 'Photo data is missing.' };
  }

  try {
    const result = await generatePoem({
      photoDataUri: input.photoDataUri,
      tone: input.tone,
      style: input.style,
    });
    return { poem: result.poem };
  } catch (e) {
    return { error: getFriendlyErrorMessage(e, 'poem') };
  }
}

export async function customizePoemAction(input: CustomizePoemToneInput): Promise<CustomizeResult> {
    if (!input.originalPoem || !input.tone) {
        return { error: 'Original poem or new tone is missing.' };
    }

    try {
        const result = await customizePoemTone({
            originalPoem: input.originalPoem,
            tone: input.tone,
        });
        return { revisedPoem: result.revisedPoem };
    } catch (e) {
        return { error: getFriendlyErrorMessage(e, 'revision') };
    }
}

export async function textToSpeechAction(input: TextToSpeechInput): Promise<TextToSpeechResult> {
    if (!input.text) {
        return { error: 'Text to speak is missing.' };
    }

    try {
        const result = await textToSpeech(input);
        return { audioDataUri: result.audioDataUri };
    } catch (e) {
        return { error: getFriendlyErrorMessage(e, 'audio') };
    }
}

export async function generateImageAction(input: GenerateImageInput): Promise<GenerateImageResult> {
    if ((!input.photoDataUri && !input.photoDataUris) || (!input.poem && !input.prompt)) {
        return { error: 'Required image data or prompt is missing.' };
    }

    try {
        const result = await generateImage(input);
        return { imageDataUri: result.imageDataUri };
    } catch (e) {
        return { error: getFriendlyErrorMessage(e, 'image') };
    }
}

export async function testVoiceAction(input: TestVoiceInput): Promise<TestVoiceResult> {
    if (!input.voiceName) {
        return { error: 'Voice name is missing.' };
    }

    try {
        const result = await testVoice(input);
        return result;
    } catch (e) {
        return { error: getFriendlyErrorMessage(e, 'voice_test') };
    }
}

    
