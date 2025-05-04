// Modified Events.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import EventCard from '../components/EventCard'
import { Event } from '../types'
import { getEvents, likeEvent } from '../api/eventsApi'
import CreateEventForm from '../components/CreateEventForm' // We'll create this component
import EventsHeader from '../components/EventsHeader'

interface EventsProps {
  initialCreating?: boolean;
}


const Events: React.FC<EventsProps> = ({ initialCreating = false }) => {
  const [events, setEvents] = useState<Event[]>([])
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [noMoreEvents, setNoMoreEvents] = useState(false)
  const [isCreatingEvent, setIsCreatingEvent] = useState(initialCreating) // New state for toggling creation mode

  const navigate = useNavigate()

  const getCurrentEvent = (): Event | null =>
    events.length > 0 ? events[currentEventIndex] : null

  const fetchEvents = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const data = await getEvents()
      if (data.length === 0) {
        setNoMoreEvents(true)
      } else {
        setEvents(data)
        setCurrentEventIndex(0)
        setNoMoreEvents(false)
      }
    } catch (err) {
      console.error(err)
      setErrorMessage('An error occurred while loading events')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLikeEvent = async () => {
    const current = getCurrentEvent()
    if (!current) return
    try {
      await likeEvent(current.id)
      moveToNextEvent()
    } catch (err) {
      console.error(err)
      setErrorMessage('An error occurred while liking the event')
    }
  }

  const handleSkipEvent = () => {
    moveToNextEvent()
  }

  const moveToNextEvent = () => {
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(i => i + 1)
    } else {
      fetchEvents()
    }
  }

  // Toggle between event viewing and creation modes
  const toggleEventCreation = () => {
    setIsCreatingEvent(!isCreatingEvent)
  }

  // Handler for when event creation is successful
  const handleEventCreated = () => {
    setIsCreatingEvent(false) // Exit creation mode
    fetchEvents() // Refresh events to include the new one
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />

      <EventsHeader
        isCreating={isCreatingEvent}
        onToggleCreate={toggleEventCreation}
      />

      {/* Conditional rendering based on mode */}
      {isCreatingEvent ? (
        <CreateEventForm onEventCreated={handleEventCreated} onCancel={toggleEventCreation} />
      ) : isLoading ? (
        <div className="p-4 border border-gray-300 text-center">
          Loading events...
        </div>
      ) : noMoreEvents ? (
        <div className="border border-gray-300 p-4 text-center">
          <p className="mb-4">No more events to show right now.</p>
          <button
            onClick={fetchEvents}
            className="border border-gray-500 bg-gray-200 px-4 py-1 font-mono hover:bg-gray-300"
          >
            Refresh
          </button>
        </div>
      ) : getCurrentEvent() ? (
        <EventCard
          event={getCurrentEvent()!}
          onLike={handleLikeEvent}
          onSkip={handleSkipEvent}
        />
      ) : (
        <div className="border border-gray-300 p-4 text-center">
          <p>No events found.</p>
        </div>
      )}
    </div>
  )
}

export default Events