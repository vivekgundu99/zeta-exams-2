'use client';

import { FC } from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
}

const Loader: FC<LoaderProps> = ({ size = 'md', fullScreen = false, text }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const loader = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
      </div>
      {text && <p className="text-gray-600 font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
        {loader}
      </div>
    );
  }

  return loader;
};

export default Loader;

// Skeleton Loader
export const SkeletonLoader: FC<{ className?: string }> = ({ className }) => (
  <div className={`skeleton ${className}`}></div>
);