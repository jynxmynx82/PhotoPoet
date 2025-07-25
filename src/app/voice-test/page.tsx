'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { testVoiceAction } from '@/app/actions';
import { Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const supportedVoices = [
  'achernar', 'achird', 'algenib', 'algieba', 'alnilam', 'aoede', 'autonoe', 
  'callirrhoe', 'charon', 'despina', 'enceladus', 'erinome', 'fenrir', 'gacrux', 
  'iapetus', 'kore', 'laomedeia', 'leda', 'orus', 'puck', 'pulcherrima', 'rasalgethi', 
  'sadachbia', 'sadaltager', 'schedar', 'sulafat', 'umbriel', 'vindemiatrix', 
  'zephyr', 'zubenelgenubi'
];

export default function VoiceTestPage() {
  const [voiceName, setVoiceName] = useState('algenib');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ audioDataUri?: string; error?: string } | null>(null);

  const handleTestVoice = async () => {
    if (!voiceName) return;
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
              Select a voice from the dropdown to hear a sample.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voiceName">Voice Name</Label>
                <Select value={voiceName} onValueChange={setVoiceName}>
                    <SelectTrigger id="voiceName">
                        <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                        {supportedVoices.map((v) => <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              <Button onClick={handleTestVoice} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader className="animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  'Test Voice'
                )}
              </Button>
            </div>

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
