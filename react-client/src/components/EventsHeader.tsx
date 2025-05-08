// Modify your EventsHeader.tsx to maintain layout consistency
import React from 'react'
import { NavLink } from 'react-router-dom'

interface EventsHeaderProps {
  isCreating?: boolean
  onToggleCreate?: () => void
}

const EventsHeader: React.FC<EventsHeaderProps> = ({ isCreating = false, onToggleCreate }) => {
  return (
    <div className="mb-8 flex items-center justify-between">
      {/* Title on the left */}
      <h1 className="text-2xl font-bold w-1/3 text-left">Event-Boy</h1>

      {/* Center navigation */}
      <div className="flex items-center space-x-2">
        <NavLink
          to="/events"
          className={({ isActive }) =>
            `${isActive ? 'text-blue-700 underline' : 'text-gray-600'} hover:text-blue-700`
          }
        >
          Events
        </NavLink>
        <span className="text-gray-400 select-none">|</span>
        <NavLink
          to="/events/liked"
          className={({ isActive }) =>
            `${isActive ? 'text-blue-700 underline' : 'text-gray-600'} hover:text-blue-700`
          }
        >
          Matches
        </NavLink>
      </div>

      {/* Create button or empty spacer on the right */}
      <div className="w-1/3 text-right">
        {onToggleCreate && (
          <button
            onClick={onToggleCreate}
            className="text-blue-700 underline hover:text-blue-900"
          >
            {isCreating ? 'Cancel Creation' : 'Create Event'}
          </button>
        )}
      </div>
    </div>
  )
}

export default EventsHeader