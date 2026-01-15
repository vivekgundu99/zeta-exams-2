'use client';

import { FC, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  gradient?: boolean;
}

const Card: FC<CardProps> = ({
  children,
  hover = false,
  gradient = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300',
        hover && 'hover:shadow-xl hover:-translate-y-1 cursor-pointer',
        gradient && 'bg-gradient-to-br from-purple-50 to-indigo-50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)} {...props}>
      {children}
    </div>
  );
};

export const CardBody: FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={cn('px-6 py-4 bg-gray-50 border-t border-gray-200', className)} {...props}>
      {children}
    </div>
  );
};

export default Card;