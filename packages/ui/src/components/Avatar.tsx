'use client';

import * as React from 'react';
import { cn } from '@dh-araria/shared/utils';
import { getInitials, getAvatarColor } from '@dh-araria/shared/utils';
import { forwardRef } from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', shape = 'circle', ...props }, ref) => {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
      '2xl': 'w-24 h-24 text-2xl',
    };

    const shapes = {
      circle: 'rounded-full',
      square: 'rounded-lg',
    };

    const [imageError, setImageError] = React.useState(false);

    if (src && !imageError) {
      return (
        <div
          ref={ref}
          className={cn(
            'inline-flex items-center justify-center overflow-hidden bg-gray-100',
            sizes[size],
            shapes[shape],
            className
          )}
          {...props}
        >
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    const initials = name ? getInitials(name) : '?';
    const colorClass = name ? getAvatarColor(name) : 'bg-gray-400';

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium text-white',
          sizes[size],
          shapes[shape],
          colorClass,
          className
        )}
        {...props}
        aria-label={name || 'Avatar'}
      >
        {initials}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({ 
  className, 
  max = 5, 
  size = 'md', 
  children,
  ...props 
}) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {visibleChildren.map((child, index) => (
        <div key={index} className="relative z-10">
          {React.cloneElement(child as React.ReactElement, { size })}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'inline-flex items-center justify-center border-2 border-white font-medium text-gray-600 bg-white',
            {
              'w-6 h-6 text-xs': size === 'xs',
              'w-8 h-8 text-sm': size === 'sm',
              'w-10 h-10 text-base': size === 'md',
              'w-12 h-12 text-lg': size === 'lg',
              'w-16 h-16 text-xl': size === 'xl',
              'w-24 h-24 text-2xl': size === '2xl',
            }
          )}
          aria-label={`${remainingCount} more people`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export { Avatar, AvatarGroup };