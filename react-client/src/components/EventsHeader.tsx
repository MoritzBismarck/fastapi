import React from 'react';
import { NavLink } from 'react-router-dom';

interface EventsHeaderProps {
  isCreating?: boolean;
  onToggleCreate?: () => void;
}

const EventsHeader: React.FC<EventsHeaderProps> = ({ isCreating = false, onToggleCreate }) => {
  const linkBase = 'font-bold text-black hover:text-black visited:text-black text-lg';
  const activeSuffix = ' underline';

  return (
    <div className="mb-8">
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="relative flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <NavLink
              to="/events"
              end
              className={({ isActive }) => 
                linkBase + (isActive ? activeSuffix : '')
              }
            >
              Events
            </NavLink>
            <span className="text-gray-400 select-none text-lg font-bold">|</span>
            <NavLink
              to="/events/matches"
              end
              className={({ isActive }) =>
                linkBase + (isActive ? activeSuffix : '')
              }
            >
              Matches
            </NavLink>
          </div>
          {onToggleCreate && (
            <button
              onClick={onToggleCreate}
              className="absolute right-0 w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors rounded"
              title={isCreating ? 'Cancel' : 'Add Event'}
            >
              {isCreating ? (
                <img 
                  src="/assets/MinusButton.png"
                  alt="Cancel"
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <img 
                  src="/assets/PlusButton.png"
                  alt="Add Event"
                  className="w-6 h-6 object-contain"
                />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="w-20" />
        <div className="flex items-center space-x-4 justify-center">
          <NavLink
            to="/events"
            end
            className={({ isActive }) =>
              linkBase + (isActive ? activeSuffix : '')
            }
          >
            Events
          </NavLink>
          <span className="text-gray-400 select-none text-lg font-bold">|</span>
          <NavLink
            to="/events/matches"
            end
            className={({ isActive }) =>
              linkBase + (isActive ? activeSuffix : '')
            }
          >
            Matches
          </NavLink>
        </div>
        <div className="w-20 text-right">
          {onToggleCreate && (
            <button
              onClick={onToggleCreate}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors rounded"
              title={isCreating ? 'Cancel' : 'Add Event'}
            >
              {isCreating ? (
                <img 
                  src="/assets/MinusButton.png"
                  alt="Cancel"
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <img 
                  src="/assets/PlusButton.png"
                  alt="Add Event"
                  className="w-6 h-6 object-contain"
                />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsHeader;