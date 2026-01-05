
'use client';

import { useState, useRef, type DragEvent, type ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { UploadCloud, Sparkles, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

interface PhotoUploaderProps {
  onImagesSelected: (dataUris: string[]) => void;
  onSingleImageUpload: (dataUri: string, tone: string, style: string) => void;
  onSettingsChange: (tone: string, style: string) => void;
  initialTone: string;
  initialStyle: string;
}

const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 4;

export default function PhotoUploader({ onImagesSelected, onSingleImageUpload, onSettingsChange, initialTone, initialStyle }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [tone, setTone] = useState(initialTone);
  const [style, setStyle] = useState(initialStyle);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    onSettingsChange(tone, style);
  }, [tone, style, onSettingsChange]);

  const handleFiles = (files: FileList) => {
    if (selectedFiles.length + files.length > MAX_FILES) {
      toast({
        variant: 'destructive',
        title: 'Too many files',
        description: `You can upload a maximum of ${MAX_FILES} images.`,
      });
      return;
    }

    const newFiles: string[] = [];
    const filePromises = Array.from(files).map(file => {
      return new Promise<void>((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          reject('Please upload only image files.');
          return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          reject(`File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          newFiles.push(e.target?.result as string);
          resolve();
        };
        reader.onerror = () => reject('Error reading file.');
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises)
      .then(() => {
        setSelectedFiles(prev => [...prev, ...newFiles]);
      })
      .catch(errorMsg => {
        toast({ variant: 'destructive', title: 'Upload Error', description: errorMsg });
      });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleNext = () => {
    if (selectedFiles.length > 0) {
      onImagesSelected(selectedFiles);
    }
  };
  
  const handleLegacyPoem = () => {
    // Create a temporary input for the single file upload
    const legacyInput = document.createElement('input');
    legacyInput.type = 'file';
    legacyInput.accept = 'image/*';
    legacyInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        if (file.size > 10 * 1024 * 1024) { // 10MB limit for legacy
          toast({ variant: 'destructive', title: 'File too large', description: 'Please select an image smaller than 10MB.' });
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          onSingleImageUpload(ev.target?.result as string, tone, style);
        };
        reader.readAsDataURL(file);
      }
    };
    legacyInput.click();
  };


  const tones = ['Reflective', 'Joyful', 'Melancholic', 'Romantic', 'Humorous', 'Dramatic'];
  const styles = ['Free Verse', 'Haiku', 'Sonnet', 'Limerick', 'Ode'];

  return (
    <Card className="w-full max-w-lg mx-auto animate-fade-in">
      <CardHeader className="text-center">
        <CardTitle>Create Your Artwork</CardTitle>
        <CardDescription>Synthesize a new image from multiple photos, or generate a poem from one.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Poem Settings */}
        <div className="space-y-4 rounded-lg border bg-background/50 p-4">
             <Label className="text-base font-medium text-center block">Poem Settings</Label>
             <p className="text-sm text-muted-foreground text-center">Choose a tone and style for your poem.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <Label htmlFor="tone">Poem Tone</Label>
                  <Select name="tone" value={tone} onValueChange={setTone}>
                      <SelectTrigger id="tone">
                      <SelectValue placeholder="Select a tone" />
                      </SelectTrigger>
                      <SelectContent>
                      {tones.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="style">Poem Style</Label>
                  <Select name="style" value={style} onValueChange={setStyle}>
                      <SelectTrigger id="style">
                      <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent>
                      {styles.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  </div>
              </div>
        </div>

        {/* Image Synthesis Section */}
        <div className="rounded-lg border p-4">
          <Label className="text-base font-medium">Image Synthesis</Label>
          <p className="text-sm text-muted-foreground mb-4">Combine 2-3 images to create a new one, then generate a poem from it.</p>
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragging ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/70'
            }`}
          >
            <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-center text-muted-foreground">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">Up to {MAX_FILES} images, {MAX_FILE_SIZE_MB}MB each</p>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileInputChange}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {selectedFiles.map((uri, index) => (
                  <div key={index} className="relative group aspect-square rounded-md overflow-hidden">
                    <Image src={uri} alt={`upload-preview-${index}`} layout="fill" objectFit="cover" />
                    <button onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button onClick={handleNext} className="w-full" disabled={selectedFiles.length < 2}>
                Next
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
            <Separator className="flex-grow" />
            <span className="text-xs text-muted-foreground">OR</span>
            <Separator className="flex-grow" />
        </div>

        {/* Direct Poem Generation Section */}
        <div className="rounded-lg border p-4 bg-secondary/30">
           <Label className="text-base font-medium">Direct Poem Generation</Label>
           <p className="text-sm text-muted-foreground mb-4">Turn a single photo into a beautiful poem.</p>
           <Button onClick={handleLegacyPoem} className="w-full" variant="secondary">
                <Sparkles className="mr-2 h-4 w-4" />
                Select Photo & Generate Poem
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
