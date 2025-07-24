'use server';

import { generatePoem, type GeneratePoemInput } from '@/ai/flows/generate-poem';
import { customizePoemTone, type CustomizePoemToneInput } from '@/ai/flows/customize-poem-tone';
import { textToSpeech, type TextToSpeechInput } from '@/ai/flows/text-to-speech';

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
        const result = await textToSpeech({ text: input.text });
        return { audioDataUri: result.audioDataUri };
    } catch (e) {
        console.error(e);
        return { error: 'An unexpected error occurred while generating audio. Please try again.' };
    }
}
