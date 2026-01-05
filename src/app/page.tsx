
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import PhotoUploader from '@/components/photo-uploader';
import PoemDisplay from '@/components/poem-display';
import ImageDescriptionDialog from '@/components/image-description-dialog';
import { generatePoemAction, generateImageAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';

type AppState = 'initial' | 'images_selected' | 'describe_image' | 'loading' | 'final_image' | 'error';
type LegacyState = 'legacy_loading' | 'poem_ready';

export default function Home() {
  // New multi-image flow state
  const [appState, setAppState] = useState<AppState>('initial');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  
  // State for the original poem flow
  const [legacyState, setLegacyState] = useState<LegacyState | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [poem, setPoem] = useState<string | null>(null);
  const [originalPoem, setOriginalPoem] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImagesSelected = (dataUris: string[]) => {
    setSelectedImages(dataUris);
    setAppState('images_selected');
  };

  const handleOpenDescriptionDialog = () => {
    setAppState('describe_image');
  };

  const handleGenerateFinalImage = async (prompt: string) => {
    setAppState('loading');
    setFinalImage(null);
    setError(null);

    const result = await generateImageAction({
      photoDataUris: selectedImages,
      prompt: prompt,
      aspectRatio: '1:1', // Defaulting to 1:1 for synthesized images for now
    });

    if (result.error) {
      setError(result.error);
      setAppState('error');
      toast({ variant: 'destructive', title: 'Error Generating Image', description: result.error });
      setAppState('images_selected'); // Go back to let the user try again
    } else if (result.imageDataUri) {
      setFinalImage(result.imageDataUri);
      setAppState('final_image');
    }
  };
  
  // Legacy poem generation handler
  const handlePhotoUpload = async (dataUri: string, tone: string, style: string) => {
    setLegacyState('legacy_loading');
    setPhotoDataUri(dataUri);
    setError(null);
    
    const result = await generatePoemAction({ photoDataUri: dataUri, tone, style });

    if (result.error) {
      setError(result.error);
      setLegacyState(null);
      setAppState('error');
      toast({ variant: 'destructive', title: 'Error Generating Poem', description: result.error });
    } else if (result.poem) {
      setPoem(result.poem);
      setOriginalPoem(result.poem);
      setLegacyState('poem_ready');
    }
  };

  const handleReset = () => {
    setAppState('initial');
    setSelectedImages([]);
    setFinalImage(null);
    setLegacyState(null);
    setPhotoDataUri(null);
    setPoem(null);
    setOriginalPoem(null);
    setError(null);
  };

  const renderContent = () => {
    if (legacyState === 'legacy_loading') {
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
    }

    if (legacyState === 'poem_ready' && photoDataUri && poem) {
      return (
        <PoemDisplay
          photoDataUri={photoDataUri}
          poem={poem}
          onRevise={() => {}} // This part of the flow is now secondary
          onReset={handleReset}
        />
      );
    }
    
    switch (appState) {
      case 'initial':
      case 'error': // Show uploader on error to allow restart
        return <PhotoUploader onImagesSelected={handleImagesSelected} onSingleImageUpload={handlePhotoUpload} />;
      
      case 'images_selected':
        return (
          <div className="w-full max-w-lg mx-auto animate-fade-in text-center">
             <Card>
                <CardContent className="p-6">
                    <h2 className="text-xl font-headline mb-4">Your Selected Images</h2>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {selectedImages.map((uri, i) => (
                            <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                                <Image src={uri} alt={`Selected image ${i+1}`} layout="fill" objectFit="cover" />
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
            onSubmit={handleGenerateFinalImage}
            images={selectedImages}
          />
        );
        
      case 'loading':
        return (
           <div className="w-full max-w-lg mx-auto animate-fade-in text-center">
             <Card>
                <CardContent className="p-6 space-y-4">
                    <h2 className="text-xl font-headline mb-4">Synthesizing Your Image...</h2>
                    <Skeleton className="w-full aspect-square rounded-lg" />
                    <div className="grid grid-cols-3 gap-2">
                        {selectedImages.map((uri, i) => (
                           <Skeleton key={i} className="w-full aspect-square rounded-md" />
                        ))}
                    </div>
                </CardContent>
            </Card>
           </div>
        );

      case 'final_image':
        if (finalImage) {
          return (
            <div className="w-full max-w-lg mx-auto animate-fade-in text-center">
              <Card>
                  <CardContent className="p-6">
                      <h2 className="text-2xl font-headline mb-4 text-primary">Your New Creation!</h2>
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg bg-black/5 mb-6">
                        <Image src={finalImage} alt="Generated final image" layout="fill" objectFit="contain" />
                      </div>
                      <Button onClick={handleReset} className="w-full">
                        <Trash2 />
                        <span>Start Over</span>
                      </Button>
                  </CardContent>
              </Card>
            </div>
          );
        }
        handleReset(); // Fallback if image is missing
        return null;

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
