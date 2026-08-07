import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { EventItem, EventStatus, EventCategory } from '../types/event';
import { EventService } from '../services/eventService';
import { EventCard } from '../components/events/EventCard';
import { Search, Sparkles, RefreshCw } from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = (searchParams.get('category') as EventCategory) || 'All';
  const initialStatus = (searchParams.get('status') as EventStatus) || undefined;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<EventCategory>(initialCategory);
  const [activeStatus, setActiveStatus] = useState<EventStatus | 'all'>(initialStatus || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: EventCategory[] = [
    'All',
    'AI & Tech',
    'Startup & Innovation',
    'Smart Cities',
    'Green Energy',
    'Women Entrepreneurs',
    'Digital Transformation',
    'Leadership'
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const data = await EventService.getEvents({
        category: activeCategory !== 'All' ? activeCategory : undefined,
        status: activeStatus !== 'all' ? (activeStatus as EventStatus) : undefined,
        searchQuery
      });
      setEvents(data);
      setLoading(false);
    };

    fetchEvents();
  }, [activeCategory, activeStatus, searchQuery]);

  return (
    <div className="pt-28 pb-24 bg-[#0B0F19] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/30">
            Event Catalog
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Explore All <span className="text-gradient-cyan">Smart Events</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Browse our curated lineup of tech summits, startup expos, masterclasses, and executive forums. Register instantly for contactless entry.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          
          {/* Search Input & Status Buttons */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event title, venue, speaker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setActiveStatus('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeStatus === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                All Statuses
              </button>
              <button
                onClick={() => setActiveStatus('upcoming')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeStatus === 'upcoming'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Upcoming
              </button>
              <button
                onClick={() => setActiveStatus('ongoing')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeStatus === 'ongoing'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Live Now
              </button>
              <button
                onClick={() => setActiveStatus('completed')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeStatus === 'completed'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Concluded
              </button>
            </div>

          </div>

          {/* Category Chips */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing <strong className="text-white">{events.length}</strong> Events</span>
          {(activeCategory !== 'All' || activeStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setActiveCategory('All');
                setActiveStatus('all');
                setSearchQuery('');
              }}
              className="text-indigo-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Loading events...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-2xl text-center max-w-md mx-auto my-12 space-y-4 border border-slate-800">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto opacity-50" />
            <h3 className="text-xl font-bold text-white">No Events Found</h3>
            <p className="text-slate-400 text-sm">
              We couldn't find any events matching your specified query.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
