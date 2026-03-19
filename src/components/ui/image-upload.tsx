"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  maxSize?: number; // in MB
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxSize = 5,
  className,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newPreviews: string[] = [];

      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          newPreviews.push(base64);

          if (newPreviews.length === acceptedFiles.length) {
            if (multiple) {
              const updated = [...previews, ...newPreviews];
              setPreviews(updated);
              onChange(updated);
            } else {
              setPreviews([newPreviews[0]]);
              onChange(newPreviews[0]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [multiple, onChange, previews]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize: maxSize * 1024 * 1024,
    multiple,
  });

  const removeImage = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onChange(multiple ? updated : "");
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-sm text-primary">Thả file vào đây...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Kéo thả ảnh vào đây hoặc click để chọn
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF lên đến {maxSize}MB {multiple && "(có thể chọn nhiều ảnh)"}
            </p>
          </div>
        )}
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg border overflow-hidden bg-gray-100">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
