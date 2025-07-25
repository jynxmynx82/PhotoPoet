'use server';

/**
 * @fileOverview A flow for generating an image from a poem.
 *
 * - generateImage - A function that generates an image based on a poem.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  poem: z.string().describe('The poem to use as inspiration for the image.'),
  photoDataUri: z
    .string()
    .describe(
      "The original photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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
  async ({poem, photoDataUri}) => {

    const imageStylePrompt = ai.definePrompt({
        name: 'imageStylePrompt',
        input: { schema: z.object({ photoDataUri: z.string() }) },
        output: { schema: z.object({ styleInstructions: z.string() })},
        prompt: `Analyze the provided image.
        
        If the image is a simple, monochromatic, or minimalist drawing or sketch, your instructions are: "Re-imagine the subject of the drawing in a vibrant, detailed, and colorful 'Pixar' animation style. Create a beautiful scene with dynamic lighting and rich textures, bringing the simple drawing to life."
        
        If the image is a full-color photograph or a complex, multi-colored artwork, your instructions are: "Generate a beautiful, artistic, and painterly image that visually represents the mood and subjects in this poem."

        Image: {{media url=photoDataUri}}
        `,
    });

    const styleResult = await imageStylePrompt({ photoDataUri });
    const styleInstructions = styleResult.output?.styleInstructions || "Generate a beautiful, artistic, and painterly image that visually represents the mood and subjects in this poem.";

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `${styleInstructions}. Poem for inspiration: ${poem}`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
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
