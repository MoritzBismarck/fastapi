// react-client/src/pages/CreateEvent.tsx
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
  start_date: string;
  end_date?: string;  // Optional for single-day events
  start_time?: string;
  end_time?: string;
  all_day: boolean;
  venue_name?: string;
  address?: string;
}

const CreateEvent: React.FC = () => {
  const { control, register, handleSubmit, reset, watch, formState: { errors } } = useForm<EventFormData>({
    defaultValues: {
      all_day: false
    }
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();
  const watchAllDay = watch('all_day');
  
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
      // Format dates for API
      const formattedStartDate = new Date(data.start_date).toISOString();
      let formattedEndDate = data.end_date ? new Date(data.end_date).toISOString() : null;
      
      // If no end date is provided, use start date
      if (!formattedEndDate && !data.all_day) {
        formattedEndDate = formattedStartDate;
      }
      
      // Step 1: Create the event
      const eventResponse = await post<{ id: string }>('/events', {
        title: data.title,
        description: data.description,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        start_time: data.start_time,
        end_time: data.end_time,
        all_day: data.all_day,
        venue_name: data.venue_name,
        address: data.address
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
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        all_day: false,
        venue_name: '',
        address: ''
      });
      clearImage();
      
    } catch (error) {
      console.error('Error creating event:', error);
      setErrorMessage('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for the input
  const formatDateForInput = () => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD
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

        {/* All-day Event Checkbox */}
        <div className="flex items-center">
          <input
            id="all_day"
            type="checkbox"
            {...register('all_day')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="all_day" className="ml-2 block text-sm text-gray-700">
            All-day event
          </label>
        </div>
        
        {/* Event Date & Time Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              Start Date *
            </label>
            <input
              id="start_date"
              type="date"
              defaultValue={formatDateForInput()}
              {...register('start_date', { required: 'Start date is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
            {errors.start_date && (
              <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>
            )}
          </div>
          
          {/* End Date (optional) */}
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              id="end_date"
              type="date"
              {...register('end_date')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          
          {/* Show time fields only if not an all-day event */}
          {!watchAllDay && (
            <>
              {/* Start Time */}
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  id="start_time"
                  type="time"
                  {...register('start_time')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              
              {/* End Time */}
              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  id="end_time"
                  type="time"
                  {...register('end_time')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </>
          )}
        </div>
        
        {/* Event Location Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Venue Name */}
          <div>
            <label htmlFor="venue_name" className="block text-sm font-medium text-gray-700">
              Venue Name
            </label>
            <input
              id="venue_name"
              type="text"
              {...register('venue_name')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              id="address"
              type="text"
              {...register('address')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
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