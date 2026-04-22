"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type HorizontalScrollProps = {
  children: ReactNode;
  title?: string;
};

const SCROLL_AMOUNT = 600;

export function HorizontalScroll({ children, title }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback((element: HTMLDivElement) => {
    const { scrollLeft, scrollWidth, clientWidth } = element;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    updateScrollButtons(event.currentTarget);
  };

  const scrollByAmount = (amount: number) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollBy({ left: amount, behavior: "smooth" });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    updateScrollButtons(container);
  }, [children, updateScrollButtons]);

  return (
    <section className="space-y-4">
      {title ? (
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
      ) : null}
      <div className="group relative">
      {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scrollByAmount(-SCROLL_AMOUNT)}
            className="absolute left-2 top-1/2 z-40 hidden -translate-y-1/2 rounded-full bg-black/70 p-2 text-white transition hover:bg-black/90 group-hover:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
        ) : null}

        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scrollByAmount(SCROLL_AMOUNT)}
            className="absolute right-2 top-1/2 z-40 hidden -translate-y-1/2 rounded-full bg-black/70 p-2 text-white transition hover:bg-black/90 group-hover:flex"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        ) : null}

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
