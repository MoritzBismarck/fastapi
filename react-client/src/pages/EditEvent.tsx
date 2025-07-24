// src/pages/EditEvent.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import EditEventForm from '../components/EditEventForm';
import { Event } from '../types';
import { getEventById } from '../api/eventsApi';

const EditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('Event ID is required');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const eventData = await getEventById(parseInt(id));
        setEvent(eventData);
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Failed to load event. You may not have permission to edit this event.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);
  
  const handleEventUpdated = () => {
    // Navigate back to matches view or wherever appropriate
    navigate('/events/matches');
  };
  
  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };
  
  if (isLoading) {
    return (
      <div className="font-mono max-w-4xl mx-auto p-4">
        <Header />
        <div className="text-center p-8">Loading event...</div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="font-mono max-w-4xl mx-auto p-4">
        <Header />
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Event not found'}
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="text-blue-700 underline hover:text-blue-900"
        >
          ← Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      <div className="mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-blue-700 underline hover:text-blue-900"
        >
          ← Back
        </button>
      </div>
      
      <div className="flex justify-center">
        <EditEventForm 
          event={event}
          onEventUpdated={handleEventUpdated}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default EditEvent;