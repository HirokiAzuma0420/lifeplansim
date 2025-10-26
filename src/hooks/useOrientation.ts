import { useState, useEffect } from 'react';

type Orientation = 'portrait' | 'landscape';

export function useOrientation(): Orientation {
  const getOrientation = () =>
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

  const [orientation, setOrientation] = useState<Orientation>(getOrientation());

  useEffect(() => {
    const handleResize = () => {
      setOrientation(getOrientation());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return orientation;
}