
'use server';

/**
 * @fileOverview Generates a poem from a photo.
 *
 * - generatePoem - A function that generates a poem from a photo.
 * - GeneratePoemInput - The input type for the generatePoem function.
 * - GeneratePoemOutput - The return type for the generatePoem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GeneratePoemInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  tone: z.string().optional().describe('The tone of the poem.'),
  style: z.string().optional().describe('The style of the poem.'),
});
export type GeneratePoemInput = z.infer<typeof GeneratePoemInputSchema>;

const GeneratePoemOutputSchema = z.object({
  poem: z.string().describe('The generated poem.'),
});
export type GeneratePoemOutput = z.infer<typeof GeneratePoemOutputSchema>;

export async function generatePoem(input: GeneratePoemInput): Promise<GeneratePoemOutput> {
  return generatePoemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePoemPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: {schema: GeneratePoemInputSchema},
  output: {schema: GeneratePoemOutputSchema},
  prompt: `You are an expert poet who specializes in creating lyrical and evocative poems inspired by images. Your task is to analyze the provided photo and compose a poem that captures its essence.

  Instructions:
  1.  Carefully observe the main subjects, setting, mood, and any details in the photo.
  2.  Write a poem that reflects what you see.
  3.  Adhere to the specified tone and style.

  Tone: {{{tone}}}
  Style: {{{style}}}
  Photo: {{media url=photoDataUri}}
  `,
});

const generatePoemFlow = ai.defineFlow(
  {
    name: 'generatePoemFlow',
    inputSchema: GeneratePoemInputSchema,
    outputSchema: GeneratePoemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model failed to produce a valid output. This may be due to a safety policy violation or a temporary issue.');
    }
    return output;
  }
);
