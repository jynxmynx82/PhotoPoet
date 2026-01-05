
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import PhotoUploader from '@/components/photo-uploader';
import PoemDisplay from '@/components/poem-display';
import ImageDescriptionDialog from '@/components/image-description-dialog';
import { generatePoemAction, generateImageAction, customizePoemAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';

type AppState = 'initial' | 'images_selected' | 'describe_image' | 'loading_image' | 'loading_poem' | 'poem_ready' | 'error';

export default function Home() {
  // Combined state
  const [appState, setAppState] = useState<AppState>('initial');

  // Image and Poem data
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [poem, setPoem] = useState<string | null>(null);
  const [originalPoem, setOriginalPoem] = useState<string | null>(null);
  
  // Poem generation settings
  const [tone, setTone] = useState('Reflective');
  const [style, setStyle] = useState('Free Verse');

  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImagesSelected = (dataUris: string[]) => {
    setSelectedImages(dataUris);
    setAppState('images_selected');
  };
  
  const handleSettingsChange = (newTone: string, newStyle: string) => {
    setTone(newTone);
    setStyle(newStyle);
  };

  const handleOpenDescriptionDialog = () => {
    setAppState('describe_image');
  };

  // Function to handle the final step of poem generation, can be called from multiple flows
  const generatePoemFromImage = async (imageDataUri: string) => {
      setPhotoDataUri(imageDataUri);
      setAppState('loading_poem');
      setError(null);

      const poemResult = await generatePoemAction({ photoDataUri: imageDataUri, tone, style });
      
      if (poemResult.error) {
        setError(poemResult.error);
        setAppState('error');
        toast({ variant: 'destructive', title: 'Error Generating Poem', description: poemResult.error });
      } else if (poemResult.poem) {
        setPoem(poemResult.poem);
        setOriginalPoem(poemResult.poem);
        setAppState('poem_ready');
      }
  }

  // New combined flow for image synthesis then poem generation
  const handleGenerateFinalImageAndPoem = async (prompt: string) => {
    setAppState('loading_image');
    setError(null);

    // Step 1: Generate the synthesized image
    const imageResult = await generateImageAction({
      photoDataUris: selectedImages,
      prompt: prompt,
      aspectRatio: '1:1',
    });

    if (imageResult.error || !imageResult.imageDataUri) {
      setError(imageResult.error || 'Failed to generate image.');
      setAppState('error');
      toast({ variant: 'destructive', title: 'Error Generating Image', description: imageResult.error });
      setAppState('images_selected');
      return;
    }
    
    // Step 2: Use the new image to generate a poem
    await generatePoemFromImage(imageResult.imageDataUri);
  };
  
  // Legacy poem generation handler
  const handleSinglePhotoUpload = async (dataUri: string, selectedTone: string, selectedStyle: string) => {
    setTone(selectedTone);
    setStyle(selectedStyle);
    await generatePoemFromImage(dataUri);
  };
  
  const handleRevisePoem = async (newTone: string) => {
    if (!originalPoem) return;
    
    // To show loading state on the poem text
    setPoem("Revising in a new tone...");

    const result = await customizePoemAction({ originalPoem, tone: newTone });

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error Revising Poem', description: result.error });
      setPoem(originalPoem); // Restore original poem on error
    } else if (result.revisedPoem) {
      setPoem(result.revisedPoem);
    }
  }

  const handleReset = () => {
    setAppState('initial');
    setSelectedImages([]);
    setPhotoDataUri(null);
    setPoem(null);
    setOriginalPoem(null);
    setError(null);
    setTone('Reflective');
    setStyle('Free Verse');
  };

  const renderContent = () => {
    switch (appState) {
      case 'initial':
      case 'error':
        return <PhotoUploader onImagesSelected={handleImagesSelected} onSingleImageUpload={handleSinglePhotoUpload} onSettingsChange={handleSettingsChange} initialTone={tone} initialStyle={style} />;
      
      case 'images_selected':
        return (
          <div className="w-full max-w-lg mx-auto animate-fade-in text-center">
             <Card>
                <CardContent className="p-6">
                    <h2 className="text-xl font-headline mb-4">Your Selected Images</h2>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {selectedImages.map((uri, i) => (
                            <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                                <Image src={uri} alt={`Selected image ${i+1}`} fill={true} objectFit="cover" />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button onClick={handleOpenDescriptionDialog} size="lg">Next: Describe Your Image</Button>
                      <Button onClick={handleReset} variant="outline">Clear & Start Over</Button>
                    </div>
                </CardContent>
            </Card>
          </div>
        );

      case 'describe_image':
        return (
          <ImageDescriptionDialog 
            isOpen={true}
            onClose={() => setAppState('images_selected')}
            onSubmit={handleGenerateFinalImageAndPoem}
            images={selectedImages}
          />
        );
        
      case 'loading_image':
        return (
           <div className="w-full max-w-lg mx-auto animate-fade-in text-center">
             <Card>
                <CardContent className="p-6 space-y-4">
                    <h2 className="text-xl font-headline mb-4">Synthesizing Your Image...</h2>
                    <Skeleton className="w-full aspect-square rounded-lg" />
                    <div className="grid grid-cols-3 gap-2">
                        {selectedImages.map((_, i) => (
                           <Skeleton key={i} className="w-full aspect-square rounded-md" />
                        ))}
                    </div>
                </CardContent>
            </Card>
           </div>
        );

      case 'loading_poem':
         return (
            <div className="w-full max-w-4xl animate-fade-in">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {photoDataUri && <Image src={photoDataUri} alt="Generated inspiration" width={500} height={500} className="w-full aspect-square rounded-lg object-contain" />}
                    <div className="space-y-4">
                      <h2 className="font-headline text-2xl lg:text-3xl text-primary mb-4">Generating Poem...</h2>
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
              onRevise={handleRevisePoem}
              onReset={handleReset}
            />
          );
        }
        handleReset(); // Fallback if data is missing
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-background text-foreground">
      <Header />
      <main className="flex-grow flex items-center justify-center w-full mt-3">
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
