import React, { useState } from 'react';
import { Image, Video, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  title?: string;
  poster?: string;
}

interface MediaGalleryProps {
  media: MediaItem[];
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ media }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (media.length === 0) {
    return (
      <div className="bg-gray-700/50 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">Медиа от грузовладельца</h3>
        <div className="text-center text-gray-400 py-8">
          <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Медиафайлы не предоставлены</p>
        </div>
      </div>
    );
  }

  const openModal = (index: number) => {
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelectedIndex(null);
  };

  const navigateModal = (direction: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    
    if (direction === 'prev') {
      setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : media.length - 1);
    } else {
      setSelectedIndex(selectedIndex < media.length - 1 ? selectedIndex + 1 : 0);
    }
  };

  return (
    <>
      <div className="bg-gray-700/50 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">Медиа от грузовладельца</h3>
        <div className="text-gray-400 text-sm mb-3">
          Найдено {media.length} {media.length === 1 ? 'файл' : media.length < 5 ? 'файла' : 'файлов'}
        </div>
        
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {media.map((item, index) => (
            <div
              key={index}
              className="relative bg-gray-600 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-500 transition-all duration-200 aspect-video"
              onClick={() => openModal(index)}
            >
              {item.type === 'image' ? (
                <>
                  <img
                    src={item.url}
                    alt={item.title || `Изображение ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 rounded-full p-1">
                    <Image className="w-3 h-3 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={item.poster || 'https://via.placeholder.com/160x90/374151/9CA3AF?text=Video'}
                    alt={item.title || `Видео ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 rounded-full p-2">
                      <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 rounded-full p-1">
                    <Video className="w-3 h-3 text-white" />
                  </div>
                </>
              )}
              
              {item.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs truncate">{item.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation buttons */}
            {media.length > 1 && (
              <>
                <button
                  onClick={() => navigateModal('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all duration-200"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => navigateModal('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all duration-200"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Media content */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {media[selectedIndex].type === 'image' ? (
                <img
                  src={media[selectedIndex].url}
                  alt={media[selectedIndex].title || `Изображение ${selectedIndex + 1}`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              ) : (
                <video
                  src={media[selectedIndex].url}
                  poster={media[selectedIndex].poster}
                  controls
                  className="w-full h-auto max-h-[80vh]"
                  autoPlay
                >
                  Ваш браузер не поддерживает воспроизведение видео.
                </video>
              )}
              
              {/* Title */}
              {media[selectedIndex].title && (
                <div className="p-4 border-t border-gray-700">
                  <h4 className="text-white font-medium">{media[selectedIndex].title}</h4>
                </div>
              )}
            </div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {selectedIndex + 1} из {media.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MediaGallery;