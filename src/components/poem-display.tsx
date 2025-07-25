
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clipboard, Wand2, Trash2, Check, Loader, ImageIcon, Download, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { textToSpeechAction } from '@/app/actions';
import { generateImageAction } from '@/app/actions';
import { Skeleton } from './ui/skeleton';

interface PoemDisplayProps {
  photoDataUri: string;
  poem: string;
  onRevise: (newTone: string) => void;
  onReset: () => void;
}

const tones = ['Reflective', 'Joyful', 'Melancholic', 'Romantic', 'Humorous', 'Dramatic'];
const supportedVoices = [
  'achernar', 'achird', 'algenib', 'algieba', 'alnilam', 'aoede', 'autonoe', 
  'callirrhoe', 'charon', 'despina', 'enceladus', 'erinome', 'fenrir', 'gacrux', 
  'iapetus', 'kore', 'laomedeia', 'leda', 'orus', 'puck', 'pulcherrima', 'rasalgethi', 
  'sadachbia', 'sadaltager', 'schedar', 'sulafat', 'umbriel', 'vindemiatrix', 
  'zephyr', 'zubenelgenubi'
];

export default function PoemDisplay({ photoDataUri, poem, onRevise, onReset }: PoemDisplayProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [newTone, setNewTone] = useState('Joyful');
  
  const [isAudioUiVisible, setIsAudioUiVisible] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('algenib');

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageDataUri, setGeneratedImageDataUri] = useState<string | null>(null);
  
  const { toast } = useToast();
  const isInitialMount = useRef(true);

  const handleGenerateAudio = async (voice: string) => {
    setIsGeneratingAudio(true);
    setAudioDataUri(null); // Clear previous audio
    const result = await textToSpeechAction({ text: poem, voiceName: voice });
    setIsGeneratingAudio(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error Generating Audio',
        description: result.error,
      });
    } else if (result.audioDataUri) {
      setAudioDataUri(result.audioDataUri);
    }
  };

  const handleInitialReadAloud = () => {
    setIsAudioUiVisible(true);
    handleGenerateAudio(selectedVoice);
  }

  // This effect runs only when the user changes the selected voice, not on the first render
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isAudioUiVisible) { // Only regenerate if the UI is already visible
      handleGenerateAudio(selectedVoice);
    }
  }, [selectedVoice]);

  // Effect to handle regenerating audio if the poem itself changes (e.g., after revision)
  // and the audio player is already visible.
  useEffect(() => {
    if (!isInitialMount.current && isAudioUiVisible) {
      handleGenerateAudio(selectedVoice);
    }
  }, [poem]);

  const handleCopy = () => {
    navigator.clipboard.writeText(poem);
    setIsCopied(true);
    toast({
      title: 'Copied to clipboard!',
      description: 'The poem is now ready to be shared.',
    });
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleDownloadImage = () => {
    if (!generatedImageDataUri) return;
    const link = document.createElement('a');
    link.href = generatedImageDataUri;
    const safeName = poem.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_') || 'poem_art';
    link.download = `${safeName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleDownloadAudio = () => {
    if (!audioDataUri) return;
    const link = document.createElement('a');
    link.href = audioDataUri;
    const safeName = poem.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_') || 'poem_audio';
    link.download = `${safeName}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    const result = await generateImageAction({ poem, photoDataUri });
    setIsGeneratingImage(false);

    if (result.error) {
        toast({ variant: 'destructive', title: 'Error Generating Image', description: result.error });
    } else if (result.imageDataUri) {
        setGeneratedImageDataUri(result.imageDataUri);
    }
  };

  return (
    <div className="w-full max-w-4xl animate-fade-in">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4">
                {isGeneratingImage ? (
                    <Skeleton className="w-full aspect-square rounded-lg" />
                ) : (
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg bg-black/5">
                        <Image src={generatedImageDataUri || photoDataUri} alt="Poem inspiration" layout="fill" objectFit="contain" data-ai-hint="poem photo"/>
                    </div>
                )}
                
                {generatedImageDataUri ? (
                    <Button onClick={handleDownloadImage} className="w-full">
                        <Download />
                        <span>Download Image</span>
                    </Button>
                ) : (
                    <Button onClick={handleGenerateImage} disabled={isGeneratingImage} className="w-full">
                        {isGeneratingImage ? (
                            <>
                                <Loader className="animate-spin" />
                                <span>Creating Artwork...</span>
                            </>
                        ) : (
                            <>
                                <ImageIcon />
                                <span>Generate Artistic Image</span>
                            </>
                        )}
                    </Button>
                )}
            </div>

            <div className="flex flex-col">
              <h2 className="font-headline text-2xl lg:text-3xl text-primary mb-4">Your Poem</h2>
              <div className="prose prose-lg text-foreground flex-grow mb-4 whitespace-pre-wrap font-body text-base leading-relaxed bg-primary/5 p-4 rounded-md">
                {poem}
              </div>
              <div className="mt-auto space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-grow space-y-1.5">
                    <Label htmlFor="revise-tone">Revise Tone</Label>
                    <Select value={newTone} onValueChange={setNewTone}>
                      <SelectTrigger id="revise-tone">
                        <SelectValue placeholder="Select a new tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => onRevise(newTone)} variant="outline">
                    <Wand2 />
                    <span>Revise</span>
                  </Button>
                </div>

                <div className="space-y-2">
                    {!isAudioUiVisible && (
                        <Button onClick={handleInitialReadAloud} disabled={isGeneratingAudio} className="w-full">
                            {isGeneratingAudio ? <Loader className="animate-spin" /> : <Volume2 />}
                            <span>Read Aloud</span>
                        </Button>
                    )}

                    {isGeneratingAudio && isAudioUiVisible && (
                        <div className="flex items-center justify-center text-sm text-muted-foreground p-2">
                            <Loader className="animate-spin mr-2" />
                            <span>Generating Audio...</span>
                        </div>
                    )}

                  {isAudioUiVisible && !isGeneratingAudio && audioDataUri && (
                    <div className="space-y-2">
                       <div className="space-y-1.5">
                          <Label htmlFor="voice-select">Voice</Label>
                          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                              <SelectTrigger id="voice-select">
                                  <SelectValue placeholder="Select a voice" />
                              </SelectTrigger>
                              <SelectContent>
                                  {supportedVoices.map((v) => <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>)}
                              </SelectContent>
                          </Select>
                       </div>
                      <audio controls src={audioDataUri} className="w-full" autoPlay>
                        Your browser does not support the audio element.
                      </audio>
                      <Button onClick={handleDownloadAudio} variant="outline" className="w-full">
                          <Download />
                          <span>Download Audio</span>
                      </Button>
                    </div>
                  )}
                </div>

                 <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleCopy} className="w-full">
                    {isCopied ? <Check /> : <Clipboard />}
                    <span>{isCopied ? 'Copied!' : 'Copy Poem'}</span>
                  </Button>
                  <Button onClick={onReset} variant="destructive" className="w-full">
                    <Trash2 />
                    <span>Start Over</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
