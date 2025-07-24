'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clipboard, Wand2, Trash2, Check, Volume2, Loader, ImageIcon, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { textToSpeechAction, generateImageAction } from '@/app/actions';
import { Skeleton } from './ui/skeleton';

type Voice = 'Algenib' | 'Sirius' | 'Andromeda' | 'Perseus' | 'Lyra';
const voices: Voice[] = ['Algenib', 'Sirius', 'Andromeda', 'Perseus', 'Lyra'];

interface PoemDisplayProps {
  photoDataUri: string;
  poem: string;
  onRevise: (newTone: string) => void;
  onReset: () => void;
}

export default function PoemDisplay({ photoDataUri, poem, onRevise, onReset }: PoemDisplayProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [newTone, setNewTone] = useState('Joyful');
  
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice>('Algenib');

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageDataUri, setGeneratedImageDataUri] = useState<string | null>(null);
  
  const isInitialMount = useRef(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // This effect should only run when the user explicitly changes the voice,
    // not on the initial render when `selectedVoice` is first set.
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
        handleGenerateAudio(selectedVoice);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoice]);


  const handleCopy = () => {
    navigator.clipboard.writeText(poem);
    setIsCopied(true);
    toast({
      title: 'Copied to clipboard!',
      description: 'The poem is now ready to be shared.',
    });
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleGenerateAudio = async (voice: Voice) => {
    setIsGeneratingAudio(true);
    setAudioDataUri(null);
    const result = await textToSpeechAction({ text: poem, voice: voice });
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
    const result = await generateImageAction({ poem });
    setIsGeneratingImage(false);

    if (result.error) {
        toast({ variant: 'destructive', title: 'Error Generating Image', description: result.error });
    } else if (result.imageDataUri) {
        setGeneratedImageDataUri(result.imageDataUri);
    }
  };

  const tones = ['Reflective', 'Joyful', 'Melancholic', 'Romantic', 'Humorous', 'Dramatic'];

  return (
    <div className="w-full max-w-4xl animate-fade-in">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4">
                {isGeneratingImage ? (
                    <Skeleton className="w-full aspect-square rounded-lg" />
                ) : (
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg">
                        <Image src={generatedImageDataUri || photoDataUri} alt="Poem inspiration" layout="fill" objectFit="cover" data-ai-hint="poem photo"/>
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

                {isGeneratingAudio && (
                    <Button disabled className="w-full">
                      <Loader className="animate-spin" />
                      <span>Generating Audio...</span>
                    </Button>
                )}

                {!isGeneratingAudio && !audioDataUri && (
                  <Button onClick={() => handleGenerateAudio(selectedVoice)} className="w-full">
                    <Volume2 />
                    <span>Read Aloud</span>
                  </Button>
                )}

                {audioDataUri && !isGeneratingAudio && (
                  <div className="space-y-2">
                    <audio controls src={audioDataUri} className="w-full" autoPlay>
                      Your browser does not support the audio element.
                    </audio>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="voice-select">Voice</Label>
                             <Select value={selectedVoice} onValueChange={(value) => setSelectedVoice(value as Voice)}>
                              <SelectTrigger id="voice-select">
                                 <SelectValue placeholder="Select a voice" />
                              </Trigger>
                              <SelectContent>
                                 {voices.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                              </SelectContent>
                             </Select>
                        </div>
                        <div className="flex flex-col justify-end">
                            <Button onClick={handleDownloadAudio} variant="outline">
                                <Download />
                                <span>Download</span>
                            </Button>
                        </div>
                    </div>
                  </div>
                )}
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
