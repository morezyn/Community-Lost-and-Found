"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReportGalleryProps {
  images: string[];
  title: string;
}

export function ReportGallery({ images, title }: ReportGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl border bg-muted/50">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageOff className="size-8" />
          <span className="text-sm">No photos for this report</span>
        </div>
      </div>
    );
  }

  const active = images[Math.min(activeIndex, images.length - 1)];

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block w-full overflow-hidden rounded-card border border-border bg-surface transition-all duration-base ease-out-soft focus-visible:ring-2 focus-visible:ring-accent-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
        aria-label="Open photo full screen"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={active}
          src={active}
          alt={`${title} — photo ${activeIndex + 1} of ${images.length}`}
          className="animate-fade-in max-h-[520px] w-full object-contain"
        />
      </button>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "aspect-square overflow-hidden rounded-lg border-2 bg-muted transition-opacity duration-fast ease-out-soft",
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === activeIndex}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-4xl border-0 bg-transparent p-0 shadow-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active}
              alt={`${title} — photo ${activeIndex + 1} of ${images.length}`}
              className="max-h-[80dvh] w-full rounded-card object-contain"
            />
            <Button
              variant="secondary"
              size="icon-sm"
              className="absolute top-3 right-3 rounded-full"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close photo"
            >
              <X />
            </Button>
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full"
                  onClick={() =>
                    setActiveIndex((index) => (index - 1 + images.length) % images.length)
                  }
                  aria-label="Previous photo"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full"
                  onClick={() => setActiveIndex((index) => (index + 1) % images.length)}
                  aria-label="Next photo"
                >
                  <ChevronRight />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
