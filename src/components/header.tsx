import { Feather } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-center text-center">
      <Feather className="w-8 h-8 md:w-10 md:h-10 mr-3 text-primary" />
      <h1 className="text-4xl md:text-5xl font-headline text-primary">
        Photo Poet
      </h1>
    </header>
  );
}
