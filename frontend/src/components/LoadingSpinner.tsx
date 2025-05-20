import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'amber-500' }) => {
  // Determine size class
  const sizeClass = {
    'sm': 'h-6 w-6 border-2',
    'md': 'h-10 w-10 border-2',
    'lg': 'h-16 w-16 border-4'
  }[size];
  
  return (
    <div className={`animate-spin rounded-full ${sizeClass} border-t-${color} border-b-${color} border-l-transparent border-r-transparent`}></div>
  );
};

export default LoadingSpinner; 