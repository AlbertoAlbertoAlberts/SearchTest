import React from 'react';
import { Listing } from '../data/mockData';
import { MapPin } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <div className="aspect-square bg-neutral-100 overflow-hidden">
        <img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-base font-medium text-neutral-900 mb-2 line-clamp-2">
          {listing.title}
        </h3>
        
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-semibold text-neutral-900">
            ${listing.price}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span className="px-2 py-1 bg-neutral-100 rounded text-xs">
            {listing.condition}
          </span>
          
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="text-xs">{listing.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
