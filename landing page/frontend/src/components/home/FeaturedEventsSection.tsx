import React, { useState, useEffect } from 'react';
import type { EventItem, EventStatus, EventCategory } from '../../types/event';
import { EventService } from '../../services/eventService';
import { EventCard } from '../events/EventCard';
import { Search, ChevronLeft, ChevronRight, ListFilter, Sparkles } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export const FeaturedEventsSection: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<EventStatus | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<EventCategory>('All');
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);

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
  }, [activeStatus, activeCategory, searchQuery]);

  // Pagination Math
  const totalItems = events.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedEvents = events.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section id="events" className="py-12 sm:py-16 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* White RTIH Filter & Dropdowns Strip matching screenshot */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left Controls: Items per page & Status dropdown */}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            
            {/* Items Per Page Select */}
            <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
              <ListFilter className="w-4 h-4 text-[#7E22CE]" />
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rtih-select px-3 py-1.5 text-sm cursor-pointer"
              >
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
              <span>Status:</span>
              <select
                value={activeStatus}
                onChange={(e) => {
                  setActiveStatus(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="rtih-select px-3.5 py-1.5 text-sm cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming / Open</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed / Closed</option>
              </select>
            </div>

            {/* Category Select */}
            <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
              <span>Category:</span>
              <select
                value={activeCategory}
                onChange={(e) => {
                  setActiveCategory(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="rtih-select px-3.5 py-1.5 text-sm cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Right Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events, venue..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#7E22CE] focus:bg-white"
            />
          </div>

        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-[#7E22CE] rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm font-medium">Loading event catalog...</p>
          </div>
        ) : displayedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <AnimatePresence>
              {displayedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl text-center max-w-md mx-auto my-8 border border-slate-200 shadow-sm space-y-4">
            <Sparkles className="w-10 h-10 text-[#7E22CE] mx-auto opacity-40" />
            <h3 className="text-xl font-bold text-slate-900">No Events Found</h3>
            <p className="text-slate-500 text-sm">
              Try modifying your filter parameters or search keywords.
            </p>
            <button
              onClick={() => {
                setActiveStatus('all');
                setActiveCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-[#7E22CE] text-white text-xs font-semibold hover:bg-[#6B21A8]"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* RTIH Pagination Bar matching screenshot */}
        {!loading && totalItems > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Left showing text: "Showing 1-8 of 19 events" */}
            <div className="text-sm font-semibold text-slate-600">
              Showing {Math.min(startIndex + 1, totalItems)}-
              {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} events
            </div>

            {/* Right pagination controls */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${
                    currentPage === pageNum
                      ? 'bg-[#7E22CE] text-white shadow-md shadow-purple-600/30'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
