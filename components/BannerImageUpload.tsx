import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Loader } from 'lucide-react';

interface BannerImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (newImageUrl: string) => void;
  coachId: string;
}

export const BannerImageUpload: React.FC<BannerImageUploadProps> = ({
  currentImageUrl,
  onImageUpdate,
  coachId
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Log when currentImageUrl changes
  useEffect(() => {
    console.log('[BannerImageUpload] currentImageUrl:', currentImageUrl ? 'Has URL' : 'No URL');
  }, [currentImageUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB for banner)
    if (file.size > 2 * 1024 * 1024) {
      setError('Banner image must be less than 2MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Convert to base64 data URL (same approach as profile photo)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        console.log('[BannerImageUpload] Using base64 data URL');
        setPreviewUrl(base64String);
        onImageUpdate(base64String);
        setUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
        setPreviewUrl(null);
        setUploading(false);
      };
      reader.readAsDataURL(file);

    } catch (err: any) {
      console.error('[BannerImageUpload] Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
      setPreviewUrl(null);
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
        Profile Banner
        <span className="ml-2 text-xs font-normal text-slate-500">
          (Like LinkedIn or X/Facebook cover photo)
        </span>
      </label>

      <div className="space-y-4">
        {/* Banner Preview */}
        <div className="relative">
          {displayUrl ? (
            <div className="relative group">
              <div className="w-full h-48 rounded-2xl overflow-hidden border-4 border-slate-100 shadow-lg bg-slate-100">
                <img
                  src={displayUrl}
                  alt="Profile Banner"
                  className="w-full h-full object-cover"
                />
              </div>
              {!uploading && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove banner"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <Loader className="h-10 w-10 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-48 rounded-2xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50">
              <ImageIcon className="h-16 w-16 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400 font-medium">No banner image</p>
            </div>
          )}
        </div>

        {/* Upload Button and Instructions */}
        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="banner-image-upload"
          />

          <label
            htmlFor="banner-image-upload"
            className={`inline-flex items-center justify-center px-5 py-3 rounded-xl font-bold transition-all cursor-pointer ${
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
                {currentImageUrl ? 'Change Banner' : 'Upload Banner'}
              </>
            )}
          </label>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
            <p className="text-xs text-blue-900 font-bold">
              Recommended: 1500 x 500px (3:1 ratio)
            </p>
            <p className="text-xs text-blue-700">
              Accepted formats: JPG, PNG, WebP (max 2MB)
            </p>
            <p className="text-xs text-blue-700">
              This banner will appear at the top of your public profile
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
