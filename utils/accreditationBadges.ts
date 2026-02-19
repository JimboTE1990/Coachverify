/**
 * Accreditation Badge Utility
 * Maps accreditation bodies and levels to their official badge images
 */

export interface BadgeInfo {
  path: string;
  alt: string;
  level: string;
}

/**
 * Get the badge path for a given accreditation body and level
 * Returns null if no badge exists for the combination
 */
export const getAccreditationBadge = (
  body: string | null | undefined,
  level: string | null | undefined
): BadgeInfo | null => {
  if (!body || !level) return null;

  const normalizedBody = body.toUpperCase().trim();
  const normalizedLevel = level.trim();

  // EMCC Badges
  if (normalizedBody === 'EMCC') {
    const emccBadges: Record<string, BadgeInfo> = {
      'Foundation': {
        path: '/assets/accreditation-badges/EMCC Accreditation - Foundation.png',
        alt: 'EMCC Foundation Level',
        level: 'Foundation'
      },
      'Practitioner': {
        path: '/assets/accreditation-badges/EMCC accreditation - Practitioner.jpg',
        alt: 'EMCC Practitioner Level',
        level: 'Practitioner'
      },
      'Senior Practitioner': {
        path: '/assets/accreditation-badges/EMCC Accreditation - Senior Practitioner.png',
        alt: 'EMCC Senior Practitioner Level',
        level: 'Senior Practitioner'
      },
      'Master Practitioner': {
        path: '/assets/accreditation-badges/EMCC Accreditation - Master Practitioner.png',
        alt: 'EMCC Master Practitioner Level',
        level: 'Master Practitioner'
      }
    };
    return emccBadges[normalizedLevel] || null;
  }

  // ICF Badges
  if (normalizedBody === 'ICF') {
    const icfBadges: Record<string, BadgeInfo> = {
      'ACC': {
        path: '/assets/accreditation-badges/ICF -ACC.png',
        alt: 'ICF Associate Certified Coach',
        level: 'ACC'
      },
      'PCC': {
        path: '/assets/accreditation-badges/ICF - PCC.png',
        alt: 'ICF Professional Certified Coach',
        level: 'PCC'
      },
      'MCC': {
        path: '/assets/accreditation-badges/ICF -MCC.png',
        alt: 'ICF Master Certified Coach',
        level: 'MCC'
      }
    };
    return icfBadges[normalizedLevel] || null;
  }

  // ILM Badges
  if (normalizedBody === 'ILM') {
    const ilmBadges: Record<string, BadgeInfo> = {
      'Level 5': {
        path: '/assets/accreditation-badges/ILM-Level-5-Diploma-Badge.png',
        alt: 'ILM Level 5 Diploma',
        level: 'Level 5'
      },
      'Level 7': {
        path: '/assets/accreditation-badges/ILM Level 7.jpg',
        alt: 'ILM Level 7',
        level: 'Level 7'
      }
    };
    return ilmBadges[normalizedLevel] || null;
  }

  return null;
};

/**
 * Check if a coach has a displayable badge
 */
export const hasAccreditationBadge = (
  body: string | null | undefined,
  level: string | null | undefined
): boolean => {
  return getAccreditationBadge(body, level) !== null;
};
