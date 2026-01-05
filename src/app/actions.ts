
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
    console.error(e);
    return { error: 'An unexpected error occurred while generating the poem. Please try again.' };
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
        console.error(e);
        return { error: 'An unexpected error occurred while revising the poem. Please try again.' };
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
        console.error(e);
        return { error: 'An unexpected error occurred while generating audio. Please try again.' };
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
        console.error(e);
        return { error: 'An unexpected error occurred while generating the image. Please try again.' };
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
        console.error(e);
        return { error: 'An unexpected error occurred while testing the voice.' };
    }
}
