"use client";

import * as React from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { MAX_IMAGES } from "@/lib/constants";
import { validateImageFile } from "@/lib/validators";
import { Label } from "@/components/ui/label";

export interface ExistingImage {
  url: string;
  path: string;
}

interface ImagePickerProps {
  newImages: Array<{ file: File; previewUrl: string }>;
  onAddFiles: (files: File[]) => void;
  onRemoveNew: (index: number) => void;
  existingImages?: ExistingImage[];
  removedPaths?: string[];
  onToggleRemoveExisting?: (path: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

/**
 * Photo picker with client-side type/size validation. Uploads happen on submit
 * so an abandoned form never leaves orphaned files in Cloudinary.
 */
export function ImagePicker({
  newImages,
  onAddFiles,
  onRemoveNew,
  existingImages = [],
  removedPaths = [],
  onToggleRemoveExisting,
  onError,
  disabled,
}: ImagePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const visibleExisting = existingImages.filter(
    (image) => !removedPaths.includes(image.path),
  );
  const total = visibleExisting.length + newImages.length;
  const atLimit = total >= MAX_IMAGES;

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList);
    const accepted: File[] = [];

    for (const file of incoming) {
      const error = validateImageFile(file);
      if (error) {
        onError?.(`${file.name}: ${error}`);
        continue;
      }
      accepted.push(file);
    }

    const room = MAX_IMAGES - total;
    if (accepted.length > room) {
      onError?.(`You can upload at most ${MAX_IMAGES} photos`);
    }

    if (accepted.slice(0, Math.max(room, 0)).length > 0) {
      onAddFiles(accepted.slice(0, Math.max(room, 0)));
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (disabled || atLimit) return;
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    setDragging(true);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    if (disabled || atLimit) return;
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="report-images">Photos</Label>
        <span className="text-xs text-muted-foreground">
          {total}/{MAX_IMAGES}
        </span>
      </div>

      <div
        className={cn(
          "grid grid-cols-2 gap-3 rounded-[14px] transition-colors duration-fast ease-out-soft sm:grid-cols-4",
          dragging && "bg-accent-soft/50 ring-2 ring-accent-brand/40",
        )}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {visibleExisting.map((image) => (
          <div
            key={image.path}
            className="group animate-scale-in relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="Current report photo" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onToggleRemoveExisting?.(image.path)}
              className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-90 transition-colors duration-fast ease-out-soft hover:bg-destructive"
              aria-label="Remove photo"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}

        {removedPaths.map((path) => {
          const image = existingImages.find((item) => item.path === path);
          if (!image) return null;
          return (
            <button
              key={path}
              type="button"
              onClick={() => onToggleRemoveExisting?.(path)}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/40 p-2 text-center text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              <span className="line-through">Photo removed</span>
              <span className="font-medium text-primary">Undo</span>
            </button>
          );
        })}

        {newImages.map((image, index) => (
          <div
            key={image.previewUrl}
            className="group animate-scale-in relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.previewUrl} alt="Selected photo preview" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveNew(index)}
              className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors duration-fast ease-out-soft hover:bg-destructive"
              aria-label="Remove selected photo"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/30 text-muted-foreground transition-colors duration-fast ease-out-soft",
              "hover:border-primary/60 hover:bg-primary/5 hover:text-primary",
              "focus-visible:ring-2 focus-visible:ring-accent-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none",
              dragging && "border-accent-brand bg-accent-soft/60 text-accent-brand",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <ImagePlus
              className={cn(
                "size-5 transition-transform duration-fast ease-out-soft",
                dragging && "scale-110",
              )}
            />
            <span className="px-2 text-center text-[11px] font-medium">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id="report-images"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, or WebP · up to 5 MB each · {MAX_IMAGES} photos max
      </p>
    </div>
  );
}
