
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface ImageDescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string) => void;
  images: string[];
}

export default function ImageDescriptionDialog({
  isOpen,
  onClose,
  onSubmit,
  images,
}: ImageDescriptionDialogProps) {
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (description.trim()) {
      onSubmit(description);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Describe Your New Image</DialogTitle>
          <DialogDescription>
            Based on the images you selected, tell the AI what kind of new picture to create.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            {images.map((uri, i) => (
              <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                <Image src={uri} alt={`Selected image ${i + 1}`} fill={true} objectFit="cover" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Your Vision</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 'A majestic cat sitting on a throne in a futuristic city, in a photorealistic style.'"
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={!description.trim()}>
            Generate Image & Poem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
