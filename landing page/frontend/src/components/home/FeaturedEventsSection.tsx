import React, { useState, useEffect, useMemo } from 'react';
import type { EventItem, EventStatus } from '../../types/event';
import { EventService } from '../../services/eventService';
import { EventCard } from '../events/EventCard';
import { Search, ChevronLeft, ChevronRight, ListFilter, Sparkles } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export const FeaturedEventsSection: React.FC = () => {
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<EventStatus | 'all'>('all');
  const [activeTeam, setActiveTeam] = useState<string>('All Teams');
  const [activeType, setActiveType] = useState<string>('All Event Types');
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const organizerTeams = [
    'All Teams',
    'Amaravathi Hub',
    'Vizag Spoke',
    'Tirupathi Spoke',
    'Rajahmundry Spoke',
    'Vijayawada Spoke',
    'Amanthpur Spoke'
  ];

  const eventTypes = [
    'All Event Types',
    'VDP',
    'Spark',
    'Udhyam'
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const data = await EventService.getEvents({});
      setAllEvents(data);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  // Reset page to 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, activeTeam, activeType, searchQuery, itemsPerPage]);

  // Combined Multi-Filter Logic
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // 1. Status Filter
      if (activeStatus !== 'all') {
        if (event.status !== activeStatus) {
          return false;
        }
      }

      // 2. Event Organizer Team Filter
      if (activeTeam !== 'All' && activeTeam !== 'All Teams') {
        const teamQuery = activeTeam.toLowerCase().trim();
        const teamClean = teamQuery.replace(/\s*(hub|spoke)\s*/g, '').trim();

        const matchTeam =
          (event.organizerTeam && event.organizerTeam.toLowerCase().includes(teamQuery)) ||
          (event.organizerName && event.organizerName.toLowerCase().includes(teamQuery)) ||
          (event.teamWide && event.teamWide.toLowerCase().includes(teamQuery)) ||
          (event.category && event.category.toLowerCase().includes(teamQuery)) ||
          (event.venue && event.venue.toLowerCase().includes(teamQuery)) ||
          (event.address && event.address.toLowerCase().includes(teamQuery)) ||
          (event.title && event.title.toLowerCase().includes(teamQuery)) ||
          (event.shortDescription && event.shortDescription.toLowerCase().includes(teamQuery)) ||
          (event.tags && event.tags.some(t => t.toLowerCase().includes(teamQuery) || t.toLowerCase().includes(teamClean)));

        // If no explicit team matched, pass through smoothly so list remains functional
        if (!matchTeam && event.organizerTeam) {
          return false;
        }
      }

      // 3. Event Type Filter
      if (activeType !== 'All' && activeType !== 'All Event Types') {
        const typeQuery = activeType.toLowerCase().trim();

        const matchType =
          (event.participantType && event.participantType.toLowerCase().includes(typeQuery)) ||
          (event.category && event.category.toLowerCase().includes(typeQuery)) ||
          (event.title && event.title.toLowerCase().includes(typeQuery)) ||
          (event.shortDescription && event.shortDescription.toLowerCase().includes(typeQuery)) ||
          (event.tags && event.tags.some(t => t.toLowerCase().includes(typeQuery)));

        // If no explicit type matched, pass through smoothly if event doesn't specify participantType
        if (!matchType && event.participantType) {
          return false;
        }
      }

      // 4. Search Query Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          (event.title && event.title.toLowerCase().includes(q)) ||
          (event.shortDescription && event.shortDescription.toLowerCase().includes(q)) ||
          (event.fullDescription && event.fullDescription.toLowerCase().includes(q)) ||
          (event.venue && event.venue.toLowerCase().includes(q)) ||
          (event.address && event.address.toLowerCase().includes(q)) ||
          (event.category && event.category.toLowerCase().includes(q)) ||
          (event.tags && event.tags.some(t => t.toLowerCase().includes(q)));

        if (!matchSearch) {
          return false;
        }
      }

      return true;
    });
  }, [allEvents, activeStatus, activeTeam, activeType, searchQuery]);

  // Pagination Math
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section id="events" className="py-12 sm:py-16 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* White RTIH Filter & Dropdowns Strip */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Left Controls: Items per page -> Status -> Event Organizer Team -> Event Type */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto">
            
            {/* Items Per Page Select */}
            <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold shrink-0">
              <ListFilter className="w-4 h-4 text-[#7E22CE]" />
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="rtih-select px-3 py-1.5 text-sm cursor-pointer"
              >
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold shrink-0">
              <span>Status:</span>
              <select
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value as any)}
                className="rtih-select px-3.5 py-1.5 text-sm cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming Events</option>
                <option value="ongoing">Ongoing Registrations</option>
                <option value="completed">Completed Events</option>
              </select>
            </div>

            {/* Event Organizer Select */}
            <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold shrink-0">
              <span>Event Organizer:</span>
              <select
                value={activeTeam}
                onChange={(e) => setActiveTeam(e.target.value)}
                className="rtih-select px-3.5 py-1.5 text-sm cursor-pointer"
              >
                {organizerTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type Select */}
            <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold shrink-0">
              <span>Event Type:</span>
              <select
                value={activeType}
                onChange={(e) => setActiveType(e.target.value)}
                className="rtih-select px-3.5 py-1.5 text-sm cursor-pointer"
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Right Search Input */}
          <div className="relative w-full lg:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                setActiveTeam('All Teams');
                setActiveType('All Event Types');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-[#7E22CE] text-white text-xs font-semibold hover:bg-[#6B21A8]"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* RTIH Pagination Bar */}
        {!loading && totalItems > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Left showing text */}
            <div className="text-sm font-semibold text-slate-600">
              Showing {Math.min(startIndex + 1, totalItems)}-
              {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} events
            </div>

            {/* Right pagination controls */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-lg font-bold text-sm transition-all cursor-pointer ${
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
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
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
