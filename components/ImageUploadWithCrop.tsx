import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, Loader, Crop, Check } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { supabase } from '../services/supabaseService';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (newImageUrl: string) => void;
  coachId: string;
  aspect?: number; // Aspect ratio (default 1 for square)
  type?: 'profile' | 'banner'; // Type of image
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageUploadWithCrop: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageUpdate,
  coachId,
  aspect = 1,
  type = 'profile'
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CropArea
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels || !selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      // Get cropped image
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create file path: user-id/type/timestamp.jpg
      const timestamp = Date.now();
      const filePath = `${user.id}/${type}/${timestamp}.jpg`;

      console.log('[ImageUpload] Uploading to:', filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, croppedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('[ImageUpload] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[ImageUpload] Upload successful');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      console.log('[ImageUpload] Public URL:', publicUrl);

      // Update parent component
      onImageUpdate(publicUrl);

      // Reset state
      setShowCropper(false);
      setImageSrc(null);
      setSelectedFile(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('[ImageUpload] Error:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageSrc(null);
    setSelectedFile(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    onImageUpdate('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isDefaultImage = currentImageUrl?.includes('logo-image-only.png') ||
                         currentImageUrl?.includes('coachdog-logo.png') ||
                         currentImageUrl?.includes('placeholder');

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {type === 'profile' ? 'Profile Photo' : 'Profile Banner'}
        {type === 'banner' && (
          <span className="ml-2 text-xs font-normal text-slate-500">
            (Like LinkedIn or X/Facebook cover photo)
          </span>
        )}
      </label>

      {/* Crop Modal */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Crop className="h-5 w-5" />
                Crop & Position Your Image
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Drag to reposition, scroll or use the slider to zoom
              </p>
            </div>

            {/* Cropper */}
            <div className="relative h-96 bg-slate-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom Controls */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={handleCancelCrop}
                disabled={uploading}
                className="px-6 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-3 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Save Image
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-6">
        {/* Image Preview */}
        <div className="relative">
          {currentImageUrl && !isDefaultImage ? (
            <div className="relative group">
              <img
                src={currentImageUrl}
                alt={type === 'profile' ? 'Profile' : 'Banner'}
                className={type === 'profile'
                  ? "w-32 h-32 rounded-2xl object-cover border-4 border-slate-100 shadow-lg"
                  : "w-full h-48 rounded-2xl object-cover border-4 border-slate-100 shadow-lg"
                }
              />
              {!uploading && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className={type === 'profile'
              ? "w-32 h-32 rounded-2xl border-4 border-dashed border-slate-200 flex items-center justify-center bg-slate-50"
              : "w-full h-48 rounded-2xl border-4 border-dashed border-slate-200 flex items-center justify-center bg-slate-50"
            }>
              <Camera className="h-12 w-12 text-slate-300" />
            </div>
          )}
        </div>

        {/* Upload Button and Instructions */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id={`${type}-upload`}
          />

          <label
            htmlFor={`${type}-upload`}
            className="inline-flex items-center px-5 py-3 rounded-xl font-bold transition-all cursor-pointer bg-brand-600 text-white hover:bg-brand-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Upload className="h-5 w-5 mr-2" />
            {currentImageUrl && !isDefaultImage ? 'Change Image' : 'Upload Image'}
          </label>

          <div className="mt-3 space-y-1">
            <p className="text-xs text-slate-500">
              {type === 'profile'
                ? 'Recommended: Square image, at least 400x400px'
                : 'Recommended: Wide image, at least 1200x400px'
              }
            </p>
            <p className="text-xs text-slate-500">
              Accepted formats: JPG, PNG, WebP (max 5MB)
            </p>
            <p className="text-xs text-slate-500 font-medium text-brand-600">
              ✨ Crop and zoom after selecting
            </p>
          </div>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
