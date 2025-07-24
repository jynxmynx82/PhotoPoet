'use server';

/**
 * @fileOverview A flow for generating a short video from an image.
 *
 * - generateVideo - A function that generates a video from an image.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const GenerateVideoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "The video data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:video/mp4;base64,<encoded_data>'."
    ),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async ({photoDataUri}) => {
    let {operation} = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: [
        {text: 'Make the image come to life with subtle motion.'},
        {media: {url: photoDataUri}},
      ],
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
        personGeneration: 'allow_adult',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('Failed to generate video: ' + operation.error.message);
    }
    
    const videoPart = operation.output?.message?.content.find(p => !!p.media);
    if (!videoPart?.media?.url) {
      throw new Error('Failed to find the generated video in the response.');
    }

    // The media URL from Veo is temporary and needs to be fetched.
    // It also requires an API key for access.
    const fetch = (await import('node-fetch')).default;
    const videoDownloadResponse = await fetch(
      `${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`
    );

    if (
      !videoDownloadResponse.ok ||
      !videoDownloadResponse.body
    ) {
      throw new Error(
        `Failed to download video: ${videoDownloadResponse.statusText}`
      );
    }

    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    
    return {
      videoDataUri: `data:video/mp4;base64,${videoBase64}`,
    };
  }
);
