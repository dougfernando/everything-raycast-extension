import { useRef, useState } from "react";

export function useDirectoryStack() {
  // Use useRef to persist the stack across re-renders
  const stackRef = useRef<string[]>([]);
  const [, setTriggerRender] = useState(0);

  const push = (dir: string) => {
    stackRef.current = [...stackRef.current, dir];
    setTriggerRender((prev) => prev + 1);
  };

  const pop = () => {
    stackRef.current = stackRef.current.slice(0, -1);
    setTriggerRender((prev) => prev - 1);
  };

  const peek = (): string | null => {
    console.log(
      "Current Stack:",
      stackRef.current,
      "Stack Length:",
      stackRef.current.length,
      "Peeked Value:",
      stackRef.current.length > 0 ? stackRef.current[stackRef.current.length - 1] : null,
      "\n",
    );
    return stackRef.current.length > 0 ? stackRef.current[stackRef.current.length - 1] : null;
  };

  return { push, pop, peek };
}
