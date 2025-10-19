'use client';

import { useState } from 'react';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  bucket: 'product-images' | 'event-images';
}

export default function ImageUpload({ currentImageUrl, onImageUploaded, bucket }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl || '');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload to server first
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const { url } = await response.json();
        console.log('✅ Uploaded file to:', url); // Debug log
        setPreview(url); // Use the uploaded URL for preview
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
        <div className="relative h-64 w-full rounded-lg overflow-hidden bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-contain"
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
        Препоръчителни размери: 800x600px, максимум 5MB
      </p>
    </div>
  );
}


