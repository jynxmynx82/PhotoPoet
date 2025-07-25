'use server';

/**
 * @fileOverview A flow for testing text-to-speech voices.
 *
 * - testVoice - A function that attempts to generate audio with a given voice name.
 * - TestVoiceInput - The input type for the testVoice function.
 * - TestVoiceOutput - The return type for the testVoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

const TestVoiceInputSchema = z.object({
  voiceName: z.string().describe('The name of the voice to test.'),
});
export type TestVoiceInput = z.infer<typeof TestVoiceInputSchema>;

const TestVoiceOutputSchema = z.object({
  audioDataUri: z
    .string()
    .optional()
    .describe(
      "The audio data as a data URI. Present on success."
    ),
    error: z.string().optional().describe("An error message if the voice generation failed.")
});
export type TestVoiceOutput = z.infer<typeof TestVoiceOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const testVoiceFlow = ai.defineFlow(
  {
    name: 'testVoiceFlow',
    inputSchema: TestVoiceInputSchema,
    outputSchema: TestVoiceOutputSchema,
  },
  async ({voiceName}) => {
    try {
        const { media } = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-tts'),
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceName },
                },
              },
            },
            prompt: `Hello, this is a test of the ${voiceName} voice.`,
          });
    
          if (!media) {
            throw new Error('No audio media was generated.');
          }
    
          const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(',') + 1),
            'base64'
          );
          
          const wavBase64 = await toWav(audioBuffer);
    
          return {
            audioDataUri: `data:audio/wav;base64,${wavBase64}`
          };
    } catch (e: any) {
        console.error(`Failed to generate voice "${voiceName}":`, e);
        return { error: e.message || 'An unknown error occurred.' }
    }
  }
);

export async function testVoice(
  input: TestVoiceInput
): Promise<TestVoiceOutput> {
  return testVoiceFlow(input);
}
