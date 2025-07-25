'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { testVoiceAction } from '@/app/actions';
import { Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VoiceTestPage() {
  const [voiceName, setVoiceName] = useState('Algenib');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ audioDataUri?: string; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    const response = await testVoiceAction({ voiceName });
    setResult(response);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-background text-foreground">
       <header className="flex items-center justify-center text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-headline text-primary">
                Voice Tester
            </h1>
        </header>
      <main className="flex-grow flex items-center justify-center w-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Test a TTS Voice</CardTitle>
            <CardDescription>
              Enter a voice name to see if it's a valid option for text-to-speech generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voiceName">Voice Name</Label>
                <Input
                  id="voiceName"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="e.g., Algenib, Andromeda"
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader className="animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  'Test Voice'
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-6">
                {result.error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                )}
                {result.audioDataUri && (
                    <>
                        <Alert>
                            <AlertTitle>Success!</AlertTitle>
                            <AlertDescription>The voice "{voiceName}" is valid. Listen below.</AlertDescription>
                        </Alert>
                        <audio controls src={result.audioDataUri} className="w-full mt-4" autoPlay>
                            Your browser does not support the audio element.
                        </audio>
                    </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
