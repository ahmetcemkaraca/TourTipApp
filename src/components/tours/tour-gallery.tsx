'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

interface TourGalleryProps {
  images: string[];
  title: string;
}

export function TourGallery({ images, title }: TourGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});

  // Use placeholder if no images or all images failed to load
  const displayImages = images.length > 0 ? images : ['/placeholder-tour.jpg'];

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  const getImageSrc = (src: string, index: number) => {
    return imageError[index] ? '/placeholder-tour.jpg' : src;
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') setIsFullScreen(false);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-[16/10] rounded-lg overflow-hidden group">
          <Image
            src={getImageSrc(displayImages[selectedImage], selectedImage)}
            alt={`${title} - Resim ${selectedImage + 1}`}
            fill
            className="object-cover"
            onError={() => handleImageError(selectedImage)}
            priority
          />
          
          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 flex items-center justify-between p-4">
              {displayImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={prevImage}
                    className="bg-white/90 hover:bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={nextImage}
                    className="bg-white/90 hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="absolute top-4 right-4">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsFullScreen(true)}
                className="bg-white/90 hover:bg-white"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {displayImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-2">
                  {displayImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === selectedImage 
                          ? 'bg-white' 
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Grid */}
        {displayImages.length > 1 && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {displayImages.slice(0, 6).map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                  index === selectedImage 
                    ? 'border-primary' 
                    : 'border-transparent hover:border-muted-foreground'
                }`}
              >
                <Image
                  src={getImageSrc(image, index)}
                  alt={`${title} - Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(index)}
                />
                {index === 5 && displayImages.length > 6 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      +{displayImages.length - 5}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-screen-xl w-full h-full p-0 bg-black">
          <DialogTitle className="sr-only">
            {title} - Resim Galerisi
          </DialogTitle>
          
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={getImageSrc(displayImages[selectedImage], selectedImage)}
              alt={`${title} - Resim ${selectedImage + 1}`}
              fill
              className="object-contain"
              onError={() => handleImageError(selectedImage)}
            />

            {/* Controls */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsFullScreen(false)}
                className="bg-white/90 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {displayImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {selectedImage + 1} / {displayImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
