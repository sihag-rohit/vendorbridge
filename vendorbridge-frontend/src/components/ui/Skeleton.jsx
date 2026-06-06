import React from 'react';

export default function Skeleton({ className = '', variant = 'rectangular', ...props }) {
  const baseClasses = "animate-pulse bg-gray-200";
  
  const variantClasses = {
    rectangular: "rounded-md",
    circular: "rounded-full",
    text: "rounded-md h-4 w-full"
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`} 
      {...props}
    />
  );
}

// Pre-built layout skeletons for convenience
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton variant="circular" className="h-10 w-10" />
      </div>
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-4 w-1/4 mt-4" />
    </div>
  );
}
