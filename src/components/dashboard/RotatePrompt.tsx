import { Smartphone } from 'lucide-react';

interface RotatePromptProps {
  onClose: () => void;
}

export default function RotatePrompt({ onClose }: RotatePromptProps) {
  return (
    <div className="absolute inset-0 bg-gray-800 bg-opacity-80 flex flex-col items-center justify-center z-20 text-white p-4 rounded-xl">
      <Smartphone size={48} className="animate-pulse mb-4" />
      <p className="text-lg font-semibold text-center">
        グラフをより見やすく表示するために、
        <br />
        画面を横向きにしてください。
      </p>
      <button
        onClick={onClose}
        className="mt-6 px-4 py-2 bg-white text-black rounded-md text-sm font-semibold"
      >
        閉じる
      </button>
    </div>
  );
}