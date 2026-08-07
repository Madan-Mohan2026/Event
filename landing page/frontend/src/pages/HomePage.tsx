import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { FeaturedEventsSection } from '../components/home/FeaturedEventsSection';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-0">
      <HeroSection />
      <FeaturedEventsSection />
    </div>
  );
};
