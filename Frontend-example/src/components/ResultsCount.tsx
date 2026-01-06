import React from 'react';

interface ResultsCountProps {
  count: number;
}

export function ResultsCount({ count }: ResultsCountProps) {
  return (
    <div className="w-full max-w-7xl mx-auto mb-8 text-center">
      <p className="text-base text-neutral-600">
        {count} {count === 1 ? 'listing' : 'listings'} found
      </p>
    </div>
  );
}
