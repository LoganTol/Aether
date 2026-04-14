import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ProductCarouselProps {
  images: { src: string; alt: string }[];
}

const ProductCarousel = ({ images }: ProductCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  const next = () => setCurrent((c) => (c + 1) % images.length);
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);

  return (
    <>
      <div className="relative w-full max-w-[600px] mx-auto">
        <div
          className="overflow-hidden rounded-2xl aspect-square bg-foreground/5 cursor-pointer"
          onClick={() => setExpanded(current)}
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              width={600}
              height={600}
              className={`absolute inset-0 w-full h-full object-contain transition-all duration-500 ${
                i === current ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            />
          ))}
        </div>

        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur flex items-center justify-center border border-border transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur flex items-center justify-center border border-border transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="flex justify-center gap-2 mt-4">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-primary w-6" : "bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {expanded !== null && (
        <div
          className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setExpanded(null)}
        >
          <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
          <img
            src={images[expanded].src}
            alt={images[expanded].alt}
            className="max-w-full max-h-full object-contain rounded-xl animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ProductCarousel;
