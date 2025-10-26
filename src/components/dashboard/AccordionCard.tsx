import { useState, type ReactNode, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionCardProps {
  title: string;
  children: ReactNode;
}

export default function AccordionCard({ title, children }: AccordionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldBeAccordion = isMobile;

  return (
    <div className="bg-white rounded-xl shadow mb-6 overflow-hidden">
      <button
        className="w-full text-left p-4 flex justify-between items-center bg-white hover:bg-gray-50 md:pointer-events-none"
        onClick={() => shouldBeAccordion && setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <ChevronDown
          className={`transform transition-transform duration-200 md:hidden ${isOpen || !shouldBeAccordion ? 'rotate-180' : ''}`}
          size={20}
        />
      </button>
      {(isOpen || !shouldBeAccordion) && (
        <div className="p-4 pt-0 md:pt-4">
          {children}
        </div>
      )}
    </div>
  );
}