// react-client/src/pages/Events.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import EventCard from '../components/EventCard'
import { Event } from '../types'
import { getEvents, likeEvent } from '../api/eventsApi'

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [noMoreEvents, setNoMoreEvents] = useState(false)

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

  useEffect(() => {
    fetchEvents()
  }, [])

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />

      {/* title + links in one row */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-xl font-bold">Event Matcher</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/events/liked')}
            className="text-blue-700 underline hover:text-blue-900"
          >
            View My Liked Events
          </button>
          <span className="text-gray-400 select-none">|</span>
          <button
            onClick={() => navigate('/events/create')}
            className="text-blue-700 underline hover:text-blue-900"
          >
            Create New Event
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="border border-red-500 p-2 mb-4 text-red-700 bg-red-100">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
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
