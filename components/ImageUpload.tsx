import React, { useState, useRef } from 'react';
import { Upload, Camera, X, Loader } from 'lucide-react';
import { supabase } from '../services/supabaseService';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (newImageUrl: string) => void;
  coachId: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageUpdate,
  coachId
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${coachId}-${Date.now()}.${fileExt}`;
      const filePath = `coach-profiles/${fileName}`;

      console.log('[ImageUpload] Uploading file:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[ImageUpload] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[ImageUpload] Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      console.log('[ImageUpload] Public URL:', publicUrl);

      // Update parent component
      onImageUpdate(publicUrl);

      // Clear preview after successful upload
      setTimeout(() => setPreviewUrl(null), 1000);

    } catch (err: any) {
      console.error('[ImageUpload] Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageUpdate('');
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-slate-700 mb-2">
        Profile Photo
      </label>

      <div className="flex items-start gap-6">
        {/* Image Preview */}
        <div className="relative">
          {displayUrl ? (
            <div className="relative group">
              <img
                src={displayUrl}
                alt="Profile"
                className="w-32 h-32 rounded-2xl object-cover border-4 border-slate-100 shadow-lg"
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
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <Loader className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-32 h-32 rounded-2xl border-4 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
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
            id="profile-photo-upload"
          />

          <label
            htmlFor="profile-photo-upload"
            className={`inline-flex items-center px-5 py-3 rounded-xl font-bold transition-all cursor-pointer ${
              uploading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
            }`}
          >
            {uploading ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                {currentImageUrl ? 'Change Photo' : 'Upload Photo'}
              </>
            )}
          </label>

          <div className="mt-3 space-y-1">
            <p className="text-xs text-slate-500">
              Recommended: Square image, at least 400x400px
            </p>
            <p className="text-xs text-slate-500">
              Accepted formats: JPG, PNG, WebP (max 5MB)
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
