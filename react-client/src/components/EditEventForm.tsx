// src/components/EditEventForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { apiClient } from '../api/client';
import { getStoredToken } from '../utils/tokenStorage';
import { Event, EventUpdate } from '../types';
import { updateEvent,} from '../api/eventsApi';
import imageCompression from 'browser-image-compression';

interface EditEventFormProps {
  event: Event;
  onEventUpdated: () => void;
  onCancel: () => void;
}

type FormData = {
  title: string;
  description: string;
  start_date: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  location: string;
  cover?: FileList;
  guest_limit?: number;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
};

const EditEventForm: React.FC<EditEventFormProps> = ({ event, onEventUpdated, onCancel }) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      start_time: event.start_time || '',
      end_date: event.end_date || '',
      end_time: event.end_time || '',
      location: event.location,
      guest_limit: event.guest_limit || undefined,
      visibility: event.visibility
    }
  });
  
  const [coverPreview, setCoverPreview] = useState<string | null>(event.cover_photo_url || null);
  const [showEnd, setShowEnd] = useState(!!event.end_date || !!event.end_time);
  const [loading, setLoading] = useState(false);
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);

  // Watch end_date and end_time to auto-show end section if they have values
  const watchEndDate = watch('end_date');
  const watchEndTime = watch('end_time');

  useEffect(() => {
    if (watchEndDate || watchEndTime) {
      setShowEnd(true);
    }
  }, [watchEndDate, watchEndTime]);

  // Cover preview handler
  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setValue('cover', files);
      setNewCoverFile(files[0]);
      setCoverPreview(URL.createObjectURL(files[0]));
    } catch (error) {
      console.error('Error creating cover preview:', error);
      alert('❌ Could not create cover preview.');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 1) Upload new cover if one was selected
      let cover_photo_url = event.cover_photo_url; // Keep existing if no new one
      
      if (newCoverFile) {
        const options = {
          maxSizeMB: 3,
          maxWidthOrHeight: 1200,
          useWebWorker: true
        };
        
        // Compress the image
        const compressedFile = await imageCompression(newCoverFile, options);
        
        const form = new FormData();
        form.append('file', compressedFile);
        
        const resp = await apiClient.post<{ file_url: string }>(
          '/events/upload/',
          form,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${getStoredToken()}`,
            },
          }
        );
        cover_photo_url = resp.data.file_url;
      }

      // 2) Build payload - send all fields with proper null handling
      const payload: any = {
        title: data.title,
        description: data.description,
        start_date: data.start_date,
        location: data.location,
        visibility: data.visibility
      };

      // Only add optional fields if they have values
      if (data.start_time && data.start_time.trim() !== '') {
        payload.start_time = data.start_time;
      }
      
      if (showEnd && data.end_date && data.end_date.trim() !== '') {
        payload.end_date = data.end_date;
      }
      
      if (showEnd && data.end_time && data.end_time.trim() !== '') {
        payload.end_time = data.end_time;
      }
      
      if (data.guest_limit && data.guest_limit > 0) {
        payload.guest_limit = Number(data.guest_limit);
      }
      
      if (cover_photo_url) {
        payload.cover_photo_url = cover_photo_url;
      }

      // 3) Update event
      console.log('Sending payload:', payload); // Debug log
      await updateEvent(event.id, payload);
      alert('✔️ Event updated successfully!');
      
      onEventUpdated(); // Notify parent component
    } catch (err) {
      console.error('Update error details:', err);
      // Log the full error response if available
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const errorWithResponse = err as { response: any };
        console.error('Error status:', errorWithResponse.response.status);
        console.error('Error data:', errorWithResponse.response.data);
      }
      alert('❌ Could not update event. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Format input "HHMM" → "HH:MM"
  const formatTimeInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + ':' + digits.slice(2);
  };

  return (
    <div className="border-4 border-black rounded-none p-6 max-w-md w-full mx-auto bg-white shadow-none flex flex-col">
      <h2 className="text-xl font-bold mb-4">Edit Event</h2>
      
      {/* Cover upload */}
      <div className="relative h-36 bg-gray-100 rounded overflow-hidden mb-4 cursor-pointer">
        {coverPreview ? (
          <img src={coverPreview} alt="Cover preview" className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            + Add photo/image
          </div>
        )}
        
        {/* File input - make sure it's clickable */}
        <input
          type="file"
          accept="image/*"
          onChange={onCoverChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        {/* Change Photo Overlay - lower z-index so it doesn't block the input */}
        {coverPreview && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <span className="text-white text-sm font-medium">Change Photo</span>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block mb-1 font-bold">Event Title:</label>
          <input
            id="title"
            type="text"
            placeholder="Name of the event"
            {...register('title', { required: true })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          {errors.title && <p className="text-red-500 text-xs">Required field</p>}
        </div>

        {/* Visibility */}
        {/* <div>
          <label htmlFor="visibility" className="block mb-1 font-bold">Visibility:</label>
          <select
            id="visibility"
            {...register('visibility', { required: true })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="PUBLIC">Public (Everyone can see)</option>
            <option value="FRIENDS">Friends Only</option>
            <option value="PRIVATE">Private (Invitation Only)</option>
          </select>
        </div> */}

        {/* Date & Time */}
        <div>
          <label className="block mb-1 font-bold">Start Date & Time:</label>
          <div className="flex space-x-2 items-center">
            <input
              type="date"
              {...register('start_date', { required: true })}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            />
            <Controller
              name="start_time"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  placeholder="HH:MM"
                  maxLength={5}
                  {...field}
                  onChange={e => field.onChange(formatTimeInput(e.target.value))}
                  className="w-24 border border-gray-300 rounded px-3 py-2 text-center"
                />
              )}
            />
          </div>
          {errors.start_date && <p className="text-red-500 text-xs">Required field</p>}
        </div>

        {/* End date/time */}
        {!showEnd ? (
          <button
            type="button"
            onClick={() => setShowEnd(true)}
            className="text-blue-500 text-sm"
          >
            + Add end date and time
          </button>
        ) : (
          <div>
            <label className="block mb-1 font-bold">End Date & Time:</label>
            <div className="flex space-x-2 items-center">
              <input
                type="date"
                {...register('end_date')}
                className="flex-1 border border-gray-300 rounded px-3 py-2"
              />
              <Controller
                name="end_time"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    placeholder="HH:MM"
                    maxLength={5}
                    {...field}
                    onChange={e => field.onChange(formatTimeInput(e.target.value))}
                    className="w-24 border border-gray-300 rounded px-3 py-2 text-center"
                  />
                )}
              />
              <button
                type="button"
                onClick={() => {
                  setShowEnd(false);
                  setValue('end_date', '');
                  setValue('end_time', '');
                }}
                className="text-red-500 text-sm px-2"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <label htmlFor="location" className="block mb-1 font-bold">Location:</label>
          <input
            id="location"
            type="text"
            placeholder="Add location"
            {...register('location', { required: true })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          {errors.location && <p className="text-red-500 text-xs">Required field</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block mb-1 font-bold">Description:</label>
          <textarea
            id="description"
            placeholder="What are the details?"
            {...register('description')}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2 resize-none"
          />
        </div>

        {/* Guest Limit */}
        <div>
          <label htmlFor="guest_limit" className="block mb-1 font-bold">Guest Limit (Optional):</label>
          <input
            id="guest_limit"
            type="number"
            placeholder="Max number of guests"
            {...register('guest_limit', { min: 1 })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-2 rounded ${
              loading 
                ? 'bg-gray-400' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Updating...' : 'Update Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEventForm;