import React from 'react';
import { getAccreditationBadge } from '../utils/accreditationBadges';

interface AccreditationBadgeProps {
  body: string | null | undefined;
  level: string | null | undefined;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * AccreditationBadge Component
 * Displays the official badge for a coach's accreditation level
 * Automatically maps body + level to the correct badge image
 */
export const AccreditationBadge: React.FC<AccreditationBadgeProps> = ({
  body,
  level,
  size = 'medium',
  className = ''
}) => {
  const badge = getAccreditationBadge(body, level);

  if (!badge) return null;

  const sizeClasses = {
    small: 'h-12 w-12',
    medium: 'h-16 w-16',
    large: 'h-24 w-24'
  };

  return (
    <img
      src={badge.path}
      alt={badge.alt}
      className={`${sizeClasses[size]} object-contain ${className}`}
      title={badge.alt}
    />
  );
};
