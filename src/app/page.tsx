
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import PhotoUploader from '@/components/photo-uploader';
import PoemDisplay from '@/components/poem-display';
import { generatePoemAction, customizePoemAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type State = 'initial' | 'loading' | 'poem_ready' | 'error';

export default function Home() {
  const [state, setState] = useState<State>('initial');
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [poem, setPoem] = useState<string | null>(null);
  const [originalPoem, setOriginalPoem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const handlePhotoUpload = async (dataUri: string, tone: string, style: string) => {
    setState('loading');
    setPhotoDataUri(dataUri);
    setError(null);
    
    const result = await generatePoemAction({ photoDataUri: dataUri, tone, style });

    if (result.error) {
      setError(result.error);
      setState('error');
      toast({
        variant: 'destructive',
        title: 'Error Generating Poem',
        description: result.error,
      });
    } else if (result.poem) {
      setPoem(result.poem);
      setOriginalPoem(result.poem);
      setState('poem_ready');
    }
  };

  const handlePoemRevision = async (newTone: string) => {
    if (!originalPoem) return;
    setState('loading');
    setError(null);

    const result = await customizePoemAction({ originalPoem, tone: newTone });
    
    if (result.error) {
      setError(result.error);
      setState('error');
      toast({
        variant: 'destructive',
        title: 'Error Revising Poem',
        description: result.error,
      });
      // Revert to poem_ready state to allow another try
      setState('poem_ready');
    } else if (result.revisedPoem) {
      setPoem(result.revisedPoem);
      setState('poem_ready');
    }
  };

  const handleReset = () => {
    setState('initial');
    setPhotoDataUri(null);
    setPoem(null);
    setOriginalPoem(null);
    setError(null);
  };

  const renderContent = () => {
    switch (state) {
      case 'initial':
        return <PhotoUploader onPhotoUpload={handlePhotoUpload} />;
      case 'loading':
        return (
          <div className="w-full max-w-4xl animate-fade-in">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {photoDataUri && <Skeleton className="w-full aspect-square rounded-lg" />}
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'poem_ready':
        if (photoDataUri && poem) {
          return (
            <PoemDisplay
              photoDataUri={photoDataUri}
              poem={poem}
              onRevise={handlePoemRevision}
              onReset={handleReset}
            />
          );
        }
        // Fallback to initial if data is missing, should not happen in normal flow
        handleReset();
        return <PhotoUploader onPhotoUpload={handlePhotoUpload} />;
      case 'error':
        // When an error occurs, we still want to show the uploader, 
        // but we might show the error message above it or within it.
        // For now, just resetting to initial state which shows the uploader.
        // The toast notification handles showing the error message.
        return <PhotoUploader onPhotoUpload={handlePhotoUpload} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-background text-foreground">
      <Header />
      <main className="flex-grow flex items-center justify-center w-full mt-8">
        {renderContent()}
      </main>
      <footer className="w-full text-center p-4 mt-8">
        <Link href="/voice-test" className="text-sm text-muted-foreground underline hover:text-primary transition-colors">
          Test Google Text-to-Speech Voices
        </Link>
      </footer>
    </div>
  );
}
