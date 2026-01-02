'use client';

import { useState } from 'react';
import imageCompression from 'browser-image-compression';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  bucket: 'product-images' | 'event-images' | 'menu-backgrounds';
  recommendedSize?: string;
}

export default function ImageUpload({ currentImageUrl, onImageUploaded, bucket, recommendedSize }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl || '');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // CLIENT-SIDE COMPRESSION: Compress image before upload
      // - Resize to max 1200px (larger dimension)
      // - Compress with quality 85%
      // - Convert to WebP if browser supports it (fallback to original format)
      const options = {
        maxSizeMB: 2, // Maximum file size (MB) - compress if larger
        maxWidthOrHeight: 1200, // Maximum width or height (pixels)
        useWebWorker: true, // Use web worker for better performance
        fileType: 'image/webp', // Try to convert to WebP (will fallback to original if not supported)
      };

      let compressedFile: File;
      try {
        compressedFile = await imageCompression(file, options);
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
        const reduction = (((file.size - compressedFile.size) / file.size) * 100).toFixed(1);
        console.log(`✅ Image compressed: ${originalSize}MB → ${compressedSize}MB (${reduction}% reduction)`);
      } catch (compressionError) {
        // If compression fails, use original file
        console.warn('⚠️ Compression failed, using original file:', compressionError);
        compressedFile = file;
      }

      // Upload compressed/original file to server
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('bucket', bucket);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const { url } = await response.json();
        console.log('✅ Uploaded file to:', url);
        setPreview(url);
        onImageUploaded(url);
      } else {
        const error = await response.json();
        alert(`Грешка при качване на снимката: ${error.error || 'Неизвестна грешка'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Грешка при качване на снимката');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-gray-300 font-semibold mb-2">Снимка</label>
      
      {preview && (
        <div className={`relative w-full rounded-lg overflow-hidden bg-gray-800 ${
          bucket === 'menu-backgrounds' ? 'h-48' : 'h-64'
        }`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className={`w-full h-full ${
              bucket === 'menu-backgrounds' ? 'object-cover' : 'object-contain'
            }`}
          />
        </div>
      )}

      <div className="flex gap-4">
        <label className="flex-1 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <div className={`px-6 py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold text-center transition-all ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}>
            {uploading ? 'Качване...' : 'Избери снимка'}
          </div>
        </label>

        {preview && (
          <button
            type="button"
            onClick={() => {
              setPreview('');
              onImageUploaded('');
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
          >
            Премахни
          </button>
        )}
      </div>

      <p className="text-gray-400 text-sm">
        {recommendedSize ? `Препоръчителни размери: ${recommendedSize}, максимум 5MB` : 'Препоръчителни размери: 800x600px, максимум 5MB'}
      </p>
    </div>
  );
}


