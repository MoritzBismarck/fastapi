import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

// Define mock event data structure
interface Friend {
  id: number;
  username: string;
  profilePicture?: string;
}

interface MockEvent {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  venueName?: string;
  address?: string;
  imageUrl?: string;
  likedBy: Friend[];
}

const DesignTest: React.FC = () => {
  const [activeDesign, setActiveDesign] = useState<number>(1);
  const [mockEvents, setMockEvents] = useState<MockEvent[]>([]);
  // Lifted state for expandable designs and liked-by popups
  const [expanded5, setExpanded5] = useState<number[]>([]);
  const [showLikedBy, setShowLikedBy] = useState<number | null>(null);
  const [expanded6, setExpanded6] = useState<number[]>([]);
  const [expanded7, setExpanded7] = useState<number[]>([]);

  const switchDesign = (designNumber: number) => {
    setActiveDesign(designNumber);
    // reset any popups when switching
    setShowLikedBy(null);
  };

  useEffect(() => {
    const friends: Friend[] = [
      { id: 1, username: 'alex', profilePicture: 'https://i.pravatar.cc/150?img=1' },
      { id: 2, username: 'jordan', profilePicture: 'https://i.pravatar.cc/150?img=2' },
      { id: 3, username: 'taylor', profilePicture: 'https://i.pravatar.cc/150?img=3' },
      { id: 4, username: 'casey', profilePicture: 'https://i.pravatar.cc/150?img=4' },
      { id: 5, username: 'morgan', profilePicture: 'https://i.pravatar.cc/150?img=5' },
    ];

    const events: MockEvent[] = [
      { id: 1, title: 'Anti-Pop 2', description: 'Anti-Pop 2 is back with another exhibition!', startDate: '2025-03-15', endDate: '2025-04-24', startTime: '18:00', endTime: '21:00', allDay: false, venueName: 'Underground Gallery', address: '123 Art Street', imageUrl: 'https://picsum.photos/id/1/800/400', likedBy: [friends[0], friends[1], friends[3]] },
      { id: 2, title: 'Outdoor Movie Night', description: 'Screening under the stars.', startDate: '2025-04-30', startTime: '20:00', endTime: '23:00', allDay: false, venueName: 'Central Park', address: 'Main St', imageUrl: 'https://picsum.photos/id/2/800/400', likedBy: [friends[1], friends[2]] },
      { id: 3, title: 'Tech Conference 2025', description: 'Biggest tech conference.', startDate: '2025-05-15', endDate: '2025-05-17', allDay: true, venueName: 'Convention Center', address: '456 Tech Blvd', imageUrl: 'https://picsum.photos/id/3/800/400', likedBy: [friends[0], friends[4]] },
      { id: 4, title: 'Food Festival', description: 'Cuisine from around the world.', startDate: '2025-06-10', endDate: '2025-06-12', startTime: '11:00', endTime: '22:00', allDay: false, venueName: 'City Square', address: '789 Food St', imageUrl: 'https://picsum.photos/id/4/800/400', likedBy: [friends[0], friends[1], friends[2], friends[3], friends[4]] },
      { id: 5, title: 'Music in the Park', description: 'Free concert in the park.', startDate: '2025-05-22', startTime: '15:00', endTime: '20:00', allDay: false, venueName: 'Greenfield Park', address: '321 Park Ave', imageUrl: 'https://picsum.photos/id/5/800/400', likedBy: [friends[3], friends[4]] },
    ];
    setMockEvents(events);
  }, []);

  const formatDateRange = (e: MockEvent) => {
    const start = new Date(e.startDate);
    const s = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (e.endDate) {
      const end = new Date(e.endDate);
      const en = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${s} – ${en}`;
    }
    return s;
  };

  const formatTimeRange = (e: MockEvent) => e.allDay ? 'All day' : e.startTime && e.endTime ? `${e.startTime}–${e.endTime}` : e.startTime || '';
  
  // DESIGN 1: Nostalgic Windows 95/Geocities Style
  const renderDesign1 = () => {
    return (
      <div className="space-y-8">
        <p className="text-gray-600 mb-4">This design embraces the old-school web aesthetic with bold borders, retro colors, and a playful layout.</p>
        {mockEvents.map(event => (
          <div key={event.id} className="border-4 border-black relative bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row">
              {/* Image with "stamp" effect */}
              {event.imageUrl && (
                <div className="md:w-1/3 relative border-b-4 md:border-b-0 md:border-r-4 border-black overflow-hidden">
                  <img 
                    src={event.imageUrl} 
                    alt={event.title} 
                    className="w-full h-48 md:h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 bg-yellow-400 px-2 py-1 border-b-2 border-l-2 border-black transform rotate-0">
                    <div className="uppercase font-bold text-xs tracking-widest">
                      {event.likedBy.length} {event.likedBy.length === 1 ? 'LIKE' : 'LIKES'}
                    </div>
                  </div>
                </div>
              )}
              {/* Content */}
              <div className="p-4 md:p-6 md:w-2/3">
                <h2 className="uppercase text-xl font-bold tracking-wider mb-2">{event.title}</h2>
                {/* Date and location with icon-like elements */}
                <div className="mb-3 font-mono">
                  <div className="inline-block mr-2 px-2 py-1 bg-black text-white font-bold">WHEN:</div>
                  <span className="font-bold">{formatDateRange(event)}</span>
                  {!event.allDay && event.startTime && (
                    <span className="ml-2 font-bold">{formatTimeRange(event)}</span>
                  )}
                </div>
                {event.venueName && (
                  <div className="mb-3 font-mono">
                    <div className="inline-block mr-2 px-2 py-1 bg-black text-white font-bold">WHERE:</div>
                    <span className="font-bold">{event.venueName}</span>
                  </div>
                )}
                <p className="mb-4 line-clamp-2">{event.description}</p>
                {/* Friend avatars in a cluster */}
                <div className="flex">
                  <div className="border-2 border-black p-2 bg-gray-100 flex items-center">
                    <span className="mr-2 uppercase font-bold text-sm">Liked by:</span>
                    <div className="flex -space-x-3">
                      {event.likedBy.slice(0, 5).map(friend => (
                        <div key={friend.id} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden" title={friend.username}>
                          {friend.profilePicture ? (
                            <img src={friend.profilePicture} alt={friend.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                              {friend.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                      {event.likedBy.length > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-black bg-black flex items-center justify-center text-xs font-bold text-white">
                          +{event.likedBy.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="ml-auto border-2 border-black bg-red-500 hover:bg-red-600 text-white px-4 uppercase font-bold tracking-wider">
                    Unlike
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // DESIGN 2: Polaroid-Style Visual Collection
  const renderDesign2 = () => {
    const groupedByMonth = mockEvents.reduce((acc, event) => {
      const date = new Date(event.startDate);
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(event);
      return acc;
    }, {} as Record<string, MockEvent[]>);
    return (
      <div>
        <p className="text-gray-600 mb-4">This design presents liked events as a collection of Polaroid-style photos, grouped by month for easier browsing.</p>
        {Object.entries(groupedByMonth).map(([monthYear, monthEvents]) => (
          <div key={monthYear} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">{monthYear}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {monthEvents.map(event => (
                <div key={event.id} className="transform hover:-rotate-2 transition-transform duration-200">
                  <div className="bg-white p-3 shadow-lg">
                    <div className="relative mb-3 aspect-square overflow-hidden bg-gray-200">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl">No Image</div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-70 py-1 px-3">
                        <span className="text-lg font-bold">{new Date(event.startDate).toLocaleDateString('en-US', { day: 'numeric' })}</span>
                        {!event.allDay && event.startTime && <span className="ml-2">{event.startTime}</span>}
                      </div>
                    </div>
                    <div className="px-1">
                      <h3 className="font-bold text-lg mb-1 line-clamp-1">{event.title}</h3>
                      {event.venueName && <p className="text-sm text-gray-600 mb-2">{event.venueName}</p>}
                      <div className="flex justify-center -mt-1 -mb-2 -ml-2 -mr-2">
                        <div className="bg-gray-100 border border-gray-300 rounded py-1 px-2 inline-flex items-center gap-1">
                          {event.likedBy.slice(0, 3).map(friend => (
                            <div key={friend.id} className="w-6 h-6 rounded-full overflow-hidden" title={friend.username}>
                              <img src={friend.profilePicture || ''} alt={friend.username} className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {event.likedBy.length > 3 && <span className="text-xs">+{event.likedBy.length - 3}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end -mt-2">
                    <button className="h-8 w-8 bg-red-600 rounded-full text-white flex items-center justify-center hover:bg-red-700 shadow-md">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // DESIGN 3: Friends-Per-Event Visualization
  const renderDesign3 = () => {
    const sortedEvents = [...mockEvents].sort((a, b) => b.likedBy.length - a.likedBy.length);
    return (
      <div>
        <p className="text-gray-600 mb-4">This design visualizes the popularity of each event among friends with a bar chart-like display.</p>
        {sortedEvents.map(event => (
          <div key={event.id} className="mb-8">
            <div className="flex items-start">
              {event.imageUrl && (
                <div className="hidden sm:block w-24 h-24 mr-4 flex-shrink-0 border-2 border-gray-300 overflow-hidden">
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{event.title}</h3>
                  <button className="text-red-600 text-sm hover:text-red-800 underline ml-4 flex-shrink-0">Unlike</button>
                </div>
                <div className="text-sm mb-3">
                  <div><strong>When:</strong> {formatDateRange(event)} {!event.allDay && event.startTime && <span className="ml-2">{formatTimeRange(event)}</span>}</div>
                  {event.venueName && <div><strong>Where:</strong> {event.venueName}</div>}
                </div>
                <div className="mt-4">
                  <div className="flex items-center mb-2">
                    <div className="font-bold mr-2">Friend Interest:</div>
                    <div className="text-sm text-gray-600">{event.likedBy.length} {event.likedBy.length === 1 ? 'person' : 'people'} liked this</div>
                  </div>
                  <div className="h-12 bg-gray-100 border border-gray-300 relative">
                    <div className="absolute top-0 left-0 bottom-0 bg-blue-500 bg-opacity-20" style={{ width: `${Math.min(100, event.likedBy.length * 20)}%` }}></div>
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center">
                      {event.likedBy.map((friend, idx) => (
                        <div key={friend.id} className="absolute h-10 w-10 rounded-full border-2 border-white overflow-hidden" style={{ left: `${Math.min(95, (idx * 18) + 2)}%` }} title={friend.username}>
                          <img src={friend.profilePicture || ''} alt={friend.username} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // DESIGN 4: Calendar View
  const renderDesign4 = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const eventsByDate: Record<string, MockEvent[]> = {};
    mockEvents.forEach(event => {
      const startDate = new Date(event.startDate);
      if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
        const dateKey = startDate.getDate().toString();
        if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
        eventsByDate[dateKey].push(event);
      }
    });
    return (
      <div>
        <p className="text-gray-600 mb-4">This design shows liked events in a calendar view to help visualize your month at a glance.</p>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <div>
            <button className="px-3 py-1 border border-gray-300 rounded-l">←</button>
            <button className="px-3 py-1 border-t border-b border-r border-gray-300 rounded-r">→</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center font-bold p-2 bg-gray-100">{day}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={idx} className="bg-gray-50 h-24 p-1"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const dateKey = day.toString();
            const eventsOnDay = eventsByDate[dateKey] || [];
            const isToday = day === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear();
            return (
              <div key={day} className={`border ${isToday ? 'border-blue-500' : 'border-gray-200'} h-24 overflow-hidden relative`}>
                <div className={`text-right p-1 ${isToday ? 'bg-blue-100' : ''}`}>{day}</div>
                {eventsOnDay.length > 0 && (
                  <div className="p-1">
                    {eventsOnDay.slice(0, 2).map(ev => (
                      <div key={ev.id} className="mb-1 truncate text-xs bg-blue-100 p-1 rounded">
                        {ev.title}
                        <span className="inline-flex ml-1 -space-x-1">
                          {ev.likedBy.slice(0, 2).map(fr => (
                            <img key={fr.id} src={fr.profilePicture} alt={fr.username} className="w-3 h-3 rounded-full border border-white overflow-hidden" />
                          ))}
                        </span>
                      </div>
                    ))}
                    {eventsOnDay.length > 2 && <div className="text-xs text-center text-blue-600">+{eventsOnDay.length - 2} more</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 border-t border-gray-300 pt-4">
          <h3 className="font-bold mb-2">Selected Events</h3>
          <div className="space-y-2">
            {mockEvents.slice(0, 2).map(ev => (
              <div key={ev.id} className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50">
                <img src={ev.imageUrl} alt={ev.title} className="w-12 h-12 mr-3 overflow-hidden rounded object-cover" />
                <div className="flex-grow">
                  <div className="font-bold">{ev.title}</div>
                  <div className="text-sm">{formatDateRange(ev)}</div>
                </div>
                <div className="flex -space-x-1 mr-2">
                  {ev.likedBy.slice(0, 3).map(fr => (
                    <img key={fr.id} src={fr.profilePicture} alt={fr.username} className="w-6 h-6 rounded-full border-white overflow-hidden" />
                  ))}
                </div>
                <button className="text-red-600 text-sm hover:text-red-800">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // DESIGN 5: Collapsible Event Cards with Retro Style
  // DESIGN 5: Simple Collapsible Event Cards
  const renderDesign5 = () => {
    const toggleExpand = (id: number) => {
      setExpanded5(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const toggleLikedBy = (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setShowLikedBy(prev => prev === id ? null : id);
    };

    return (
      <div className="space-y-4">
        <p className="text-gray-600">Click card to expand; click avatars to view liked-by list.</p>
        {mockEvents.map(ev => {
          const isExpanded = expanded5.includes(ev.id);
          const showing = showLikedBy === ev.id;
          return (
            <div key={ev.id} className="border p-3 shadow-sm bg-white cursor-pointer" onClick={() => toggleExpand(ev.id)}>
              <div className="flex items-center">
                <img src={ev.imageUrl} alt="" className="w-16 h-16 mr-3 object-cover border" />
                <div className="flex-grow">
                  <h3 className="font-bold">{ev.title}</h3>
                  <div className="text-sm text-gray-600">{formatDateRange(ev)} {!!ev.startTime && <span> • {formatTimeRange(ev)}</span>}</div>
                </div>
                <div className="flex -space-x-2" onClick={(e) => toggleLikedBy(ev.id, e)}>
                  {ev.likedBy.slice(0,3).map(f => (
                    <img key={f.id} src={f.profilePicture} alt="" className="w-7 h-7 rounded-full border" />
                  ))}
                  {ev.likedBy.length > 3 && <span className="w-7 h-7 flex items-center justify-center border text-xs">+{ev.likedBy.length-3}</span>}
                </div>
              </div>

              {showing && (
                <div className="mt-2 bg-gray-100 p-2 border">
                  <strong>Liked by:</strong>
                  <ul className="pl-4 list-disc text-sm">
                    {ev.likedBy.map(f => <li key={f.id}>{f.username}</li>)}
                  </ul>
                </div>
              )}

              {isExpanded && (
                <div className="mt-3 text-gray-700">
                  {ev.venueName && <div><strong>Where:</strong> {ev.venueName}</div>}
                  <div className="mt-1">{ev.description}</div>
                  <div className="mt-2 text-right">
                    <button className="px-2 py-1 border">Unlike</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // DESIGN 6: Minimal File Browser Style
  const renderDesign6 = () => {
    const toggleExpand = (id: number) => {
      setExpanded6(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    return (
      <div className="border-2 border-gray-400">
        <div className="bg-gray-200 border-b-2 border-gray-400 p-2 font-bold">Your Liked Events</div>
        <div className="p-2">
          <p className="text-gray-600 mb-4">This design mimics a classic file browser with collapsible event details.</p>
          <div className="space-y-1">
            {mockEvents.map(event => {
              const isExpanded = expanded6.includes(event.id);
              return (
                <div key={event.id} className="border border-gray-300">
                  <div className="flex items-center cursor-pointer p-2 bg-gray-100 hover:bg-gray-200" onClick={() => toggleExpand(event.id)}>
                    <div className="mr-2 w-4 h-4 flex items-center justify-center text-xs">{isExpanded ? '▼' : '►'}</div>
                    <img src={event.imageUrl} alt={event.title} className="w-10 h-10 border border-gray-400 mr-2 object-cover" />
                    <div className="flex-grow">
                      <div className="font-bold truncate">{event.title}</div>
                      <div className="text-xs text-gray-600">{formatDateRange(event)}</div>
                    </div>
                    <div className="flex -space-x-1">
                      {event.likedBy.slice(0, 3).map(fr => <img key={fr.id} src={fr.profilePicture} alt={fr.username} className="w-6 h-6 rounded-full border-white object-cover" />)}
                      {event.likedBy.length > 3 && <div className="w-6 h-6 rounded-full border-white bg-gray-400 flex items-center justify-center text-xs font-bold text-white">+{event.likedBy.length - 3}</div>}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-3 border-t border-gray-300">
                      <img src={event.imageUrl} alt={event.title} className="w-32 h-32 border border-gray-400 mr-4 mb-2 object-cover float-left" />
                      <div>
                        {event.venueName && <div className="mb-1"><strong>Venue:</strong> {event.venueName}</div>}
                        {event.address && <div className="mb-1"><strong>Address:</strong> {event.address}</div>}
                        {!event.allDay && event.startTime && <div className="mb-1"><strong>Time:</strong> {formatTimeRange(event)}</div>}
                        <p className="mt-2 text-sm">{event.description}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center">
                        <div><strong>Liked by:</strong> {event.likedBy.map(f => f.username).join(', ')}</div>
                        <button className="bg-gray-200 hover:bg-gray-300 border border-gray-400 px-2 py-1 text-sm">Unlike</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // DESIGN 7: Bulletin Board / Newspaper Style
  const renderDesign7 = () => {
    const toggleExpand = (id: number) => {
      setExpanded7(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    return (
      <div className="space-y-4">
        <p className="text-gray-600 mb-4">This design presents events like headlines in a newspaper or postings on a bulletin board.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockEvents.map(event => {
            const isExpanded = expanded7.includes(event.id);
            return (
              <div key={event.id} className="border border-black overflow-hidden bg-yellow-50">
                <div onClick={() => toggleExpand(event.id)} className="cursor-pointer">
                  <img src={event.imageUrl} alt={event.title} className="w-full h-32 object-cover" />
                  <div className="flex justify-between items-center bg-gray-200 px-2 py-1 border-t border-b border-black">
                    <div className="text-sm font-bold">{formatDateRange(event)}</div>
                    <div className="flex -space-x-1">
                      {event.likedBy.slice(0, 3).map(fr => <img key={fr.id} src={fr.profilePicture} alt={fr.username} className="w-5 h-5 rounded-full border-white object-cover" />)}
                      {event.likedBy.length > 3 && <div className="w-5 h-5 rounded-full border-white bg-gray-400 flex items-center justify-center text-xs font-bold text-white">+{event.likedBy.length - 3}</div>}
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{event.title}</h3>
                    {event.venueName && <div className="text-sm">{event.venueName}</div>}                    <div className="text-right text-sm text-gray-500">{isExpanded ? 'Click to collapse ▲' : 'Click for details ▼'}</div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-dashed border-black p-3 bg-yellow-50">
                    <p className="mb-3 text-sm">{event.description}</p>
                    <div className="text-sm mb-2"><strong>When:</strong> {formatDateRange(event)}{!event.allDay && event.startTime && <span> at {formatTimeRange(event)}</span>}</div>
                    {event.address && <div className="text-sm mb-2"><strong>Address:</strong> {event.address}</div>}
                    <div className="mt-3 pt-2 border-t border-dashed border-black flex justify-between items-center">
                      <div className="text-sm"><strong>Liked by:</strong> {event.likedBy.map(f => f.username).join(', ')}</div>
                      <button className="bg-white hover:bg-gray-100 border border-black px-2 py-1 text-xs">Unlike</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Design Testing Lab</h1>
        <p className="text-gray-600">Test different UI designs for the Liked Events page</p>
      </div>
      <div className="mb-6 border border-gray-300 p-4 bg-gray-100">
        <h2 className="font-bold mb-3">Select a Design</h2>
        <div className="flex flex-wrap gap-2">
          {[1,2,3,4,5,6,7].map(num => (
            <button
              key={num}
              onClick={() => switchDesign(num)}
              className={`px-4 py-2 border ${activeDesign === num ? 'bg-blue-600 text-white border-blue-700' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
            >
              Design {num}
            </button>
          ))}
        </div>
      </div>
      <div className="border-4 border-black p-4">
        <h2 className="text-xl font-bold mb-4">Design {activeDesign} Preview</h2>
        {activeDesign === 1 && renderDesign1()}
        {activeDesign === 2 && renderDesign2()}
        {activeDesign === 3 && renderDesign3()}
        {activeDesign === 4 && renderDesign4()}
        {activeDesign === 5 && renderDesign5()}
        {activeDesign === 6 && renderDesign6()}
        {activeDesign === 7 && renderDesign7()}
      </div>
    </div>
  );
};

export default DesignTest;
