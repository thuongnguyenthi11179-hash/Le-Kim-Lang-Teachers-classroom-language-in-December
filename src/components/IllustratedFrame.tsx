import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface IllustratedFrameProps {
  src: string;
  alt: string;
  title?: string;
  aspectClass?: string;
  className?: string;
}

export function IllustratedFrame({
  src,
  alt,
  title,
  aspectClass = 'aspect-[4/3]',
  className = '',
}: IllustratedFrameProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`w-full max-w-full ${aspectClass} ${className} flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-teal-50 to-amber-50 p-6 text-center text-sky-900`}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="h-10 w-10 text-sky-600 mb-2" aria-hidden="true" />
        <p className="font-display text-base font-semibold">{title || alt}</p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-full ${aspectClass} ${className} relative overflow-hidden bg-sky-50`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
