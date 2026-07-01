import { useEffect, useState, type ReactNode } from 'react';

interface ChartMountProps {
  /** Remount charts when this key changes (e.g. theme). */
  chartKey: string;
  children: ReactNode;
}

/** Defers Chart.js mount to the next frame to avoid React 19 text-node removeChild races. */
export default function ChartMount({ chartKey, children }: ChartMountProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [chartKey]);

  if (!mounted) {
    return <div className="h-full w-full min-h-[4rem]" aria-hidden />;
  }

  return (
    <div key={chartKey} className="h-full w-full">
      {children}
    </div>
  );
}
