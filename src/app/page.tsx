import AppClient from '@/components/app-client';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const backgroundImage = PlaceHolderImages.find(p => p.id === "1");

  return (
    <main className="relative min-h-screen w-full">
       {backgroundImage && (
        <Image
          src={backgroundImage.imageUrl}
          alt={backgroundImage.description}
          fill
          className="object-cover -z-10"
          data-ai-hint={backgroundImage.imageHint}
          priority
        />
      )}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm -z-10" />
      <AppClient />
    </main>
  );
}
