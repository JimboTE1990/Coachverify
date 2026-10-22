import React, { useState } from 'react';
import { X, MessageCircle, Mail, Copy, Facebook, Instagram, Linkedin } from 'lucide-react';

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  url, title, text = '', className, children,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
    } else {
      setShowModal(true);
    }
  };

  const shareVia = (platform: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(text);

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`,
    };

    if (platform === 'copy' || platform === 'instagram') {
      navigator.clipboard.writeText(url).catch(() => {});
      alert(`Link copied!${platform === 'instagram' ? ' Open Instagram and paste into your story or bio.' : ''}`);
      setShowModal(false);
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400');
      setShowModal(false);
    }
  };

  return (
    <>
      <button onClick={handleShare} className={className}>
        {children}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-black text-slate-900">Share</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-3 gap-4">
              <button onClick={() => shareVia('whatsapp')} className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-green-50 transition-colors group">
                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-700">WhatsApp</span>
              </button>

              <button onClick={() => shareVia('facebook')} className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-blue-50 transition-colors group">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Facebook className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-700">Facebook</span>
              </button>

              <button onClick={() => shareVia('twitter')} className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-sky-50 transition-colors group">
                <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-700">X / Twitter</span>
              </button>

              <button onClick={() => shareVia('linkedin')} className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-blue-50 transition-colors group">
                <div className="w-14 h-14 rounded-full bg-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Linkedin className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-700">LinkedIn</span>
              </button>

              <button onClick={() => shareVia('instagram')} className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-pink-50 transition-colors group">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Instagram className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-700">Instagram</span>
              </button>

              <button onClick={() => shareVia('email')} className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                <div className="w-14 h-14 rounded-full bg-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-700">Email</span>
              </button>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => shareVia('copy')}
                className="w-full bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
