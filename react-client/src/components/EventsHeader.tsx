// react-client/src/components/EventsHeader.tsx
import React from 'react'
import { NavLink } from 'react-router-dom'

interface EventsHeaderProps {
  isCreating?: boolean
  onToggleCreate?: () => void
}

const EventsHeader: React.FC<EventsHeaderProps> = ({ isCreating = false, onToggleCreate }) => {
  return (
    <div className="mb-8">
      {/* Mobile Layout: Stack navigation and button */}
      <div className="block md:hidden space-y-4">
        {/* Navigation centered on mobile */}
        <div className="flex items-center justify-center space-x-3">
          <NavLink
            to="/events"
            className={({ isActive }) =>
              isActive
                ? 'font-bold text-black underline hover:text-black text-lg'
                : 'font-bold text-orange-800 hover:text-black text-lg'
            }
          >
            Events
          </NavLink>
          <span className="text-gray select-none text-lg">|</span>
          <NavLink
            to="/events/matches"
            className={({ isActive }) =>
              isActive
                ? 'font-bold text-black underline hover:text-black text-lg'
                : 'font-bold text-orange-800 hover:text-black text-lg'
            }
          >
            Matches
          </NavLink>
        </div>

        {/* Create button full width on mobile */}
        {onToggleCreate && (
          <div className="w-full">
            <button
              onClick={onToggleCreate}
              className="w-full py-2 px-4 border border-black text-black font-bold hover:bg-gray-100 transition-colors"
            >
              {isCreating ? '✕ Cancel' : '+ Create Event'}
            </button>
          </div>
        )}
      </div>

      {/* Desktop Layout: Three column layout */}
      <div className="hidden md:flex items-center justify-between">
        {/* Empty spacer on the left for balance */}
        <div className="w-1/3"></div>

        {/* Center navigation */}
        <div className="flex items-center space-x-4 justify-center">
          <NavLink
            to="/events"
            className={({ isActive }) =>
              isActive
                ? 'font-bold text-black underline hover:text-black text-lg'
                : 'font-bold text-orange-800 hover:text-black text-lg'
            }
          >
            Events
          </NavLink>
          <span className="text-gray-400 select-none text-lg">|</span>
          <NavLink
            to="/events/matches"
            className={({ isActive }) =>
              isActive
                ? 'font-bold text-black underline hover:text-black text-lg'
                : 'font-bold text-orange-800 hover:text-black text-lg'
            }
          >
            Matches
          </NavLink>
        </div>

        {/* Create button on the right */}
        <div className="w-1/3 text-right">
          {onToggleCreate && (
            <button
              onClick={onToggleCreate}
              className="px-4 py-2 border border-black text-black-700 font-bold hover:bg-gray-100 transition-colors"
            >
              {isCreating ? '✕ Cancel' : '+ Create Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventsHeader