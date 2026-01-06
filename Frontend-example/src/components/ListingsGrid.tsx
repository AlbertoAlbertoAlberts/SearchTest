import React from 'react';
import { ListingCard } from './ListingCard';
import { Listing } from '../data/mockData';

interface ListingsGridProps {
  listings: Listing[];
  shouldBlur: boolean;
  hasSearched: boolean;
}

export function ListingsGrid({ listings, shouldBlur, hasSearched }: ListingsGridProps) {
  if (!hasSearched) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-400 text-lg">Start searching to see listings</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-600 text-lg">No listings found</p>
        <p className="text-neutral-400 text-sm mt-2">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-500 ${shouldBlur ? 'blur-sm opacity-60' : 'blur-0 opacity-100'}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
