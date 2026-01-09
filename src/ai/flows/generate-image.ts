
'use server';

/**
 * @fileOverview A flow for generating an image from a poem or multiple images and a prompt.
 *
 * - generateImage - A function that generates an image.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MediaPart, Part } from 'genkit';

const GenerateImageInputSchema = z.object({
  poem: z.string().optional().describe('The poem to use as inspiration for the image.'),
  prompt: z.string().optional().describe('A text description for synthesizing a new image.'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A single photo, as a data URI."
    ),
  photoDataUris: z.array(z.string()).optional().describe('An array of photos as data URIs.'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional().default('1:1').describe('The desired aspect ratio for the generated image.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The generated image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({poem, prompt, photoDataUri, photoDataUris, aspectRatio}) => {
    const model = 'googleai/gemini-2.5-flash-image';
    const promptParts: Part[] = [];

    // Image Synthesis Flow
    if (prompt && photoDataUris) {
      promptParts.push({text: `Generate a new, synthesized image based on the following instructions and photo references. The final image should have an aspect ratio of ${aspectRatio}. When generating the new image, you MUST preserve the apparent ethnicity, gender, and other key physical attributes of any people depicted in the original image. Instructions: ${prompt}`});
      for (const uri of photoDataUris) {
          promptParts.push({media: {url: uri}});
      }
    } 
    // Artistic Image from Poem Flow
    else if (poem && photoDataUri) {
        const styleInstruction = "Generate a beautiful, artistic, and painterly image that visually represents the mood and subjects in this poem. Preserve the apparent ethnicity, gender, and other key physical attributes of any people depicted in the original image.";
        promptParts.push({text: `${styleInstruction} The image should have an aspect ratio of ${aspectRatio}.`});
        promptParts.push({media: {url: photoDataUri}});
        promptParts.push({text: `Poem for inspiration: ${poem}`});
    }

    if (promptParts.length === 0) {
        throw new Error('Not enough information to generate an image. You must provide either a prompt and multiple images, or a poem and a single image.');
    }

    const {media} = await ai.generate({
      model,
      prompt: promptParts,
      config: {
        responseModalities: ['IMAGE'],
      },
    });
    
    if (!media || !media.url) {
      throw new Error('No image was generated.');
    }

    return {
      imageDataUri: media.url,
    };
  }
);


export async function generateImage(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}
