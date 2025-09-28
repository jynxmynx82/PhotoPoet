
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
  async ({poem, photoDataUri, aspectRatio}) => {

    const imageStylePrompt = ai.definePrompt({
        name: 'imageStylePrompt',
        input: { schema: z.object({ photoDataUri: z.string() }) },
        output: { schema: z.object({ styleInstructions: z.string() })},
        prompt: `Analyze the provided image and determine its style. Based on the style, provide one of the following sets of instructions. When generating the new image, you MUST preserve the apparent ethnicity, gender, and other key physical attributes of any people depicted in the original image.

1. If the image is a simple, monochromatic, or minimalist drawing or sketch (like a pen on paper), your instructions are: "Re-imagine the subject of the drawing in a vibrant, detailed, and colorful 'Pixar' animation style. Create a beautiful scene with dynamic lighting and rich textures, bringing the simple drawing to life. It is crucial to preserve the apparent ethnicity, gender, and other key physical attributes of any person in the original image."

2. If the image is a complex but non-photorealistic piece of art (e.g., a cartoon, abstract art, a stylized illustration), your instructions are: "Generate a photorealistic version of this image. Interpret the subjects and composition of the original artwork and render them as if they were captured in a high-resolution photograph. Focus on realistic lighting, shadows, and textures. It is crucial to preserve the apparent ethnicity, gender, and other key physical attributes of any person in the original image."

3. If the image is a full-color, realistic photograph, your instructions are: "Generate a beautiful, artistic, and painterly image that visually represents the mood and subjects in this poem. It is crucial to preserve the apparent ethnicity, gender, and other key physical attributes of any person in the original image."

Image: {{media url=photoDataUri}}
        `,
    });

    const styleResult = await imageStylePrompt({ photoDataUri });
    const styleInstructions = styleResult.output?.styleInstructions || "Generate a beautiful, artistic, and painterly image that visually represents the mood and subjects in this poem. Preserve the apparent ethnicity, gender, and other key physical attributes of any people depicted in the original image.";

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: `${styleInstructions}. Poem for inspiration: ${poem}. The image should have an aspect ratio of ${aspectRatio}.`,
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
