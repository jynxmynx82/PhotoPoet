'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clipboard, Wand2, Trash2, Check, Volume2, Loader, Film, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { textToSpeechAction, generateVideoAction } from '@/app/actions';
import { Skeleton } from './ui/skeleton';

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

  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoDataUri, setVideoDataUri] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(poem);
    setIsCopied(true);
    toast({
      title: 'Copied to clipboard!',
      description: 'The poem is now ready to be shared.',
    });
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleReadAloud = async () => {
    setIsGeneratingAudio(true);
    setAudioDataUri(null);
    const result = await textToSpeechAction({ text: poem });
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

  const handleAnimatePhoto = async () => {
    setIsGeneratingVideo(true);
    setVideoDataUri(null);
    const result = await generateVideoAction({ photoDataUri });
    setIsGeneratingVideo(false);

    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Error Generating Video',
            description: result.error,
        });
    } else if (result.videoDataUri) {
        setVideoDataUri(result.videoDataUri);
    }
  };

  const tones = ['Reflective', 'Joyful', 'Melancholic', 'Romantic', 'Humorous', 'Dramatic'];

  return (
    <div className="w-full max-w-4xl animate-fade-in">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg">
                    <Image src={photoDataUri} alt="Uploaded inspiration" layout="fill" objectFit="cover" data-ai-hint="poem photo"/>
                </div>
                {isGeneratingVideo && (
                    <div className="space-y-2 text-center">
                        <Skeleton className="w-full aspect-video rounded-lg" />
                        <p className="text-sm text-muted-foreground animate-pulse">Generating your video... This may take up to a minute.</p>
                    </div>
                )}
                {videoDataUri && (
                    <div className="space-y-2">
                        <video ref={videoRef} controls src={videoDataUri} className="w-full rounded-lg" loop autoPlay playsInline>
                            Your browser does not support the video tag.
                        </video>
                         <a href={videoDataUri} download="poem-video.mp4">
                            <Button variant="outline" className="w-full">
                                <Download />
                                <span>Download Video</span>
                            </Button>
                        </a>
                    </div>
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

                <div className="flex flex-col sm:flex-row gap-2">
                    {!isGeneratingVideo && !videoDataUri && (
                        <Button onClick={handleAnimatePhoto} className="w-full">
                            <Film />
                            <span>Animate Photo</span>
                        </Button>
                    )}
                </div>

                {!audioDataUri && (
                  <Button onClick={handleReadAloud} disabled={isGeneratingAudio} className="w-full">
                    {isGeneratingAudio ? (
                      <>
                        <Loader className="animate-spin" />
                        <span>Generating Audio...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 />
                        <span>Read Aloud</span>
                      </>
                    )}
                  </Button>
                )}
                {audioDataUri && (
                  <div className="space-y-2">
                    <audio controls src={audioDataUri} className="w-full">
                      Your browser does not support the audio element.
                    </audio>
                    <Button onClick={() => setAudioDataUri(null)} variant="outline" className="w-full">
                      <Volume2 />
                      <span>Generate Again</span>
                    </Button>
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
