import Skeleton, { TableSkeleton } from './Skeleton';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div className={`${sizes[size]} border-gray-200 border-t-primary-600 rounded-full animate-spin ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="w-full h-full p-4 animate-fade-in">
      <TableSkeleton rows={4} cols={4} />
    </div>
  );
}
