import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const messages = [
    "Starlink Connected ",
    "Pulling Memory Streams "
  ];

  const [text, setText] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "dots" | "done">("typing");
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (phase === "typing") {
      let index = 0;
      interval = setInterval(() => {
        setText(messages[messageIndex].substring(0, index + 1));
        index++;
        if (index >= messages[messageIndex].length) {
          clearInterval(interval);
          setTimeout(() => {
            setPhase("dots");
            setDotCount(0);
          }, 300); // pause before dots
        }
      }, 100);
    }

    if (phase === "dots") {
      interval = setInterval(() => {
        setText((prev) => prev + ".");
        setDotCount((prev) => prev + 1);
        if (dotCount >= 2) {
          clearInterval(interval);
          if (messageIndex < messages.length - 1) {
            setTimeout(() => {
              setMessageIndex((prev) => prev + 1);
              setText("");
              setPhase("typing");
            }, 500); // pause before next message
          } else {
            setPhase("done");
            setTimeout(onComplete, 1000); // call onComplete after last msg
          }
        }
      }, 500); // slower dot speed
    }

    return () => clearInterval(interval);
  }, [phase, messageIndex, dotCount, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center">
      <div className="mb-5 text-xl sm:text-xl md:text-3xl lg:text-4xl font-mono font-bold">
        {text}
        <span className="animate-blink ml-1">|</span>
      </div>

      <div className="w-[200px] h-[2px] bg-gray-800 rounded relative overflow-hidden">
        <div className="w-[40%] h-full bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-loading-bar"></div>
      </div>
    </div>
  );
};
