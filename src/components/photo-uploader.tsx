'use client';

import { useState, useRef, type DragEvent } from 'react';
import Link from 'next/link';
import { UploadCloud, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploaderProps {
  onPhotoUpload: (dataUri: string, tone: string, style: string) => void;
}

export default function PhotoUploader({ onPhotoUpload }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [tone, setTone] = useState('Reflective');
  const [style, setStyle] = useState('Free Verse');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        onPhotoUpload(dataUri, tone, style);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please upload an image file.',
      });
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const tones = ['Reflective', 'Joyful', 'Melancholic', 'Romantic', 'Humorous', 'Dramatic'];
  const styles = ['Free Verse', 'Haiku', 'Sonnet', 'Limerick', 'Ode'];

  return (
    <Card className="w-full max-w-lg mx-auto animate-fade-in">
      <CardHeader className="text-center">
        <CardTitle>Create Poetry from a Photo</CardTitle>
        <CardDescription>Upload an image and watch AI turn it into a unique poem.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleClick();
          }}
          className="space-y-6"
        >
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
          
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragging ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/70'
            }`}
          >
            <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop an image
            </p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF, AVIF, WEBP up to 10MB</p>
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Poem
          </Button>
        </form>
        <div className="text-center mt-4">
          <Link href="/voice-test" className="text-sm text-muted-foreground underline hover:text-primary transition-colors">
            Test Google Text-to-Speech Voices
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
