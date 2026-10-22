import { useEffect } from 'react';

const DEFAULTS = {
  title: 'CoachDog · Find Your Verified Coach',
  description: 'Browse accredited coaches verified by EMCC, ICF, and AC. Find your perfect match and book a free introductory call.',
  ogImage: 'https://www.coachdog.co.uk/og-image.png',
};

interface PageMeta {
  title: string;
  description: string;
  ogImage?: string;
  canonical?: string;
}

function setMeta(attrName: string, attrValue: string, content: string) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function removeCanonical() {
  document.querySelector('link[rel="canonical"]')?.remove();
}

export function usePageMeta({ title, description, ogImage, canonical }: PageMeta) {
  useEffect(() => {
    const img = ogImage ?? DEFAULTS.ogImage;

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', img);
    if (canonical) {
      setMeta('property', 'og:url', canonical);
      setCanonical(canonical);
    }

    return () => {
      document.title = DEFAULTS.title;
      setMeta('name', 'description', DEFAULTS.description);
      setMeta('property', 'og:title', DEFAULTS.title);
      setMeta('property', 'og:description', DEFAULTS.description);
      setMeta('property', 'og:image', DEFAULTS.ogImage);
      setMeta('name', 'twitter:title', DEFAULTS.title);
      setMeta('name', 'twitter:description', DEFAULTS.description);
      setMeta('name', 'twitter:image', DEFAULTS.ogImage);
      if (canonical) {
        setMeta('property', 'og:url', 'https://www.coachdog.co.uk');
        removeCanonical();
      }
    };
  }, [title, description, ogImage, canonical]);
}
