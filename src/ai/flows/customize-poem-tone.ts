'use server';

/**
 * @fileOverview Flow for customizing the tone and style of a generated poem.
 *
 * - customizePoemTone - Function to adjust the poem's tone and style based on user preferences.
 * - CustomizePoemToneInput - The input type for the customizePoemTone function.
 * - CustomizePoemToneOutput - The return type for the customizePoemTone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomizePoemToneInputSchema = z.object({
  originalPoem: z.string().describe('The original generated poem.'),
  tone: z.string().describe('The desired tone or style for the poem (e.g., romantic, humorous, serious).'),
});
export type CustomizePoemToneInput = z.infer<typeof CustomizePoemToneInputSchema>;

const CustomizePoemToneOutputSchema = z.object({
  revisedPoem: z.string().describe('The poem revised with the specified tone and style.'),
});
export type CustomizePoemToneOutput = z.infer<typeof CustomizePoemToneOutputSchema>;

export async function customizePoemTone(input: CustomizePoemToneInput): Promise<CustomizePoemToneOutput> {
  return customizePoemToneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customizePoemTonePrompt',
  input: {schema: CustomizePoemToneInputSchema},
  output: {schema: CustomizePoemToneOutputSchema},
  prompt: `You are a skilled poet, adept at modifying the tone and style of existing poems.

  Original Poem: {{{originalPoem}}}
  Instructions: Please revise the poem above to have a {{{tone}}} tone. Retain the original poem's subject and overall structure as much as possible.

  Revised Poem:`, 
});

const customizePoemToneFlow = ai.defineFlow(
  {
    name: 'customizePoemToneFlow',
    inputSchema: CustomizePoemToneInputSchema,
    outputSchema: CustomizePoemToneOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
