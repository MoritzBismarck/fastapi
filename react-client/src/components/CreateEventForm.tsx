// src/components/CreateEventForm.tsx
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { post, apiClient } from '../api/client';
import { getStoredToken } from '../utils/tokenStorage';
import imageCompression from 'browser-image-compression';

interface CreateEventFormProps {
  onEventCreated: () => void;
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
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';  // Add visibility to form data
};

const CreateEventForm: React.FC<CreateEventFormProps> = ({ onEventCreated, onCancel }) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      visibility: 'PUBLIC'  // Set default visibility
    }
  });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Cover preview handler
  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setValue('cover', files);
      setCoverPreview(URL.createObjectURL(files[0]));
    } catch (error) {
      console.error('Error creating cover preview:', error);
      alert('❌ Could not create cover preview.');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 1) Upload cover
      let image_url = '';
      if (data.cover && data.cover.length) {
        const options = {
          maxSizeMB: 3,
          maxWidthOrHeight: 1200,
          useWebWorker: true
        };
        
        // Compress the image
        const originalFile = data.cover[0];
        const compressedFile = await imageCompression(originalFile, options);
        
        console.log('Original size:', originalFile.size / 1024, 'KB');
        console.log('Compressed size:', compressedFile.size / 1024, 'KB');
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
        image_url = resp.data.file_url;
      }

      // 2) Build payload
      const payload = {
        title: data.title,
        description: data.description,
        start_date: data.start_date,
        start_time: data.start_time,
        end_date: showEnd ? data.end_date : undefined,
        end_time: showEnd ? data.end_time : undefined,
        location: data.location,
        cover_photo_url: image_url,
        guest_limit: data.guest_limit ? Number(data.guest_limit) : undefined,
        visibility: data.visibility  // Use the selected visibility instead of hardcoded 'PUBLIC'
      };

      // 3) Create event
      await post('/events', payload);

      alert('✔️ Event created successfully!');
      onEventCreated(); // Notify parent component
    } catch (err) {
      console.error(err);
      alert('❌ Could not create event.');
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
      <h2 className="text-xl font-bold mb-4">Create New Event</h2>
      
      {/* Cover upload */}
      <div className="relative h-36 bg-gray-100 rounded overflow-hidden mb-4">
        {coverPreview ? (
          <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Click below to add cover photo
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-4">
        
        {/* Cover file input */}
        <div>
          <label htmlFor="cover" className="block mb-1 font-bold">Cover Photo:</label>
          <input
            id="cover"
            type="file"
            accept="image/*"
            onChange={onCoverChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Event Title */}
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

        {/* Visibility Selector */}
        <div>
          <label htmlFor="visibility" className="block mb-1 font-bold">Who can see this event:</label>
          <select
            id="visibility"
            {...register('visibility', { required: true })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="PUBLIC">🌍 Public (Everyone)</option>
            <option value="FRIENDS">👥 Private (Friends)</option>
            {/* <option value="PRIVATE">🔒 Private (Invitation Only)</option> */}
          </select>
          <p className="text-xs text-gray-600 mt-1">
            Choose who can discover your event on the platform
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block mb-1 font-bold">Description:</label>
          <textarea
            id="description"
            placeholder="What's this event about?"
            {...register('description', { required: true })}
            className="w-full border border-gray-300 rounded px-3 py-2 h-20 resize-none"
          />
          {errors.description && <p className="text-red-500 text-xs">Required field</p>}
        </div>

        {/* Date & Time */}
        <div>
          <label className="block mb-1 font-bold">Start Date & Time:</label>
          <div className="flex space-x-2 items-center">
            <input
              type="date"
              min={today}
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
            className="text-blue-600 text-sm underline self-start"
          >
            + Add end date/time
          </button>
        ) : (
          <div>
            <label className="block mb-1 font-bold">End Date & Time:</label>
            <div className="flex space-x-2 items-center">
              <input
                type="date"
                min={today}
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
                onClick={() => setShowEnd(false)}
                className="text-red-600 text-sm"
              >
                ✕
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
            placeholder="Where is the event?"
            {...register('location', { required: true })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          {errors.location && <p className="text-red-500 text-xs">Required field</p>}
        </div>

        {/* Guest Limit */}
        <div>
          <label htmlFor="guest_limit" className="block mb-1 font-bold">Guest Limit (optional):</label>
          <input
            id="guest_limit"
            type="number"
            min="1"
            placeholder="Max number of attendees"
            {...register('guest_limit')}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border-2 border-gray-400 bg-white text-gray-800 py-2 px-4 rounded-none font-bold hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 border-2 border-blue-600 py-2 px-4 rounded-none font-bold ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventForm;