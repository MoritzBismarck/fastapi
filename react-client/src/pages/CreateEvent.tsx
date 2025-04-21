import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { post } from '../api/client';
import axios from 'axios';
import { getStoredToken } from '../utils/tokenStorage';

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  location: string;
}

const CreateEvent: React.FC = () => {
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<EventFormData>();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();
  
  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Clear image selection
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };
  
  // Handle form submission
  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Format date for API
      const formattedDate = new Date(data.event_date).toISOString();
      
      // Step 1: Create the event
      const eventResponse = await post<{ id: string }>('/events', {
        ...data,
        event_date: formattedDate
      });
      
      // Step 2: If we have an image, upload it to the event
      if (selectedImage && eventResponse.id) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        
        const token = getStoredToken();
        await axios.post(
          `http://127.0.0.1:8000/events/${eventResponse.id}/image`, 
          formData, 
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          }
        );
      }
      
      // Show success message
      setSuccessMessage('Event created successfully!');
      
      // Reset form for next event
      reset({
        title: '',
        description: '',
        event_date: '',
        location: ''
      });
      clearImage();
      
    } catch (error) {
      console.error('Error creating event:', error);
      setErrorMessage('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date-time for the input
  const formatDateTimeForInput = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create New Event</h1>
        <p className="text-gray-600">Fill in the details below to create a new event.</p>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Event Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Event Title *
          </label>
          <input
            id="title"
            type="text"
            {...register('title', { required: 'Title is required' })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>
        
        {/* Event Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description', { required: 'Description is required' })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>
        
        {/* Event Date & Time */}
        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-gray-700">
            Event Date & Time *
          </label>
          <input
            id="event_date"
            type="datetime-local"
            defaultValue={formatDateTimeForInput()}
            {...register('event_date', { required: 'Event date is required' })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
          {errors.event_date && (
            <p className="text-red-500 text-sm mt-1">{errors.event_date.message}</p>
          )}
        </div>
        
        {/* Event Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            id="location"
            type="text"
            {...register('location')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        
        {/* Event Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Image
          </label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="event-image"
            />
            <label 
              htmlFor="event-image"
              className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {selectedImage ? 'Change Image' : 'Select Image'}
            </label>
            {imagePreview && (
              <button
                type="button"
                onClick={clearImage}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-2">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-48 w-auto object-cover rounded-md" 
              />
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>
      
      {/* Back to Events button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/events')}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Back to Events
        </button>
      </div>
    </div>
  );
};

export default CreateEvent;