// src/components/EditEventForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { apiClient } from '../api/client';
import { getStoredToken } from '../utils/tokenStorage';
import { Event, EventUpdate } from '../types';
import { updateEvent } from '../api/eventsApi';
import imageCompression from 'browser-image-compression';
import Button from './Button';

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

  // Watch fields for form completion check
  const watchedFields = watch(['title', 'start_date', 'location', 'description', 'visibility']);
  const [title, startDate, location, description, visibility] = watchedFields;

  // Watch end_date and end_time to auto-show end section if they have values
  const watchEndDate = watch('end_date');
  const watchEndTime = watch('end_time');

  useEffect(() => {
    if (watchEndDate || watchEndTime) {
      setShowEnd(true);
    }
  }, [watchEndDate, watchEndTime]);

  // Check if form has changes or all required fields are filled
  const isFormReady = !!(
    title && 
    startDate && 
    visibility
  );

  const today = new Date().toISOString().split('T')[0];

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

  // Helper: Format input "HHMM" → "HH:MM"
  const formatTimeInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + ':' + digits.slice(2);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 1) Upload cover photo if new one is selected
      let image_url = event.cover_photo_url; // Keep existing if no new file
      
      if (newCoverFile) {
        const options = {
          maxSizeMB: 3,
          maxWidthOrHeight: 1200,
          useWebWorker: true
        };
        
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
        image_url = resp.data.file_url;
      }

      // 2) Build payload
      const payload: EventUpdate = {
        title: data.title,
        description: data.description,
        start_date: data.start_date,
        start_time: data.start_time || undefined,
        end_date: showEnd ? data.end_date : undefined,
        end_time: showEnd ? data.end_time : undefined,
        location: data.location,
        cover_photo_url: image_url || undefined,
        guest_limit: data.guest_limit ? Number(data.guest_limit) : undefined,
        visibility: data.visibility
      };

      // 3) Update event
      await updateEvent(event.id, payload);

      alert('✔️ Event updated successfully!');
      onEventUpdated();
    } catch (err) {
      console.error(err);
      alert('❌ Could not update event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      
      {/* Scrollable Content */}
      <div className="p-4 space-y-6">
        
        {/* Cover Photo - Big focal point */}
        <div className="relative">
          <div className="relative h-80 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Event cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <div>Add a cover photo</div>
                </div>
              </div>
            )}
            
            {/* Upload Button Overlay */}
            <label className="absolute inset-0 cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                onChange={onCoverChange}
                className="hidden"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <div className="bg-black text-white px-4 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {coverPreview ? 'Change Photo' : 'Add Photo'}
                </div>
              </div>
            </label>
          </div>
        </div>

        <form className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block mb-2 text-lg font-bold">Event Title</label>
            <input
              id="title"
              type="text"
              placeholder="Name your event"
              {...register('title', { required: true })}
              className="w-full border-2 border-black rounded-none px-4 py-3 text-lg font-mono focus:outline-none focus:bg-yellow-100"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">This field is required</p>}
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <label className="block text-lg font-bold">📅 When</label>
            
            {/* Start Date & Time */}
            <div>
              <div className="text-sm font-bold mb-2">Start</div>
              <div className="flex gap-2">
                <input
                  type="date"
                  min={today}
                  {...register('start_date', { required: true })}
                  className="flex-1 border-2 border-black rounded-none px-4 py-3 font-mono focus:outline-none focus:bg-yellow-100"
                />
                <Controller
                  name="start_time"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      placeholder="19:00"
                      maxLength={5}
                      {...field}
                      onChange={e => field.onChange(formatTimeInput(e.target.value))}
                      className="w-24 border-2 border-black rounded-none px-4 py-3 text-center font-mono focus:outline-none focus:bg-yellow-100"
                    />
                  )}
                />
              </div>
              {errors.start_date && <p className="text-red-500 text-sm mt-1">Start date is required</p>}
            </div>

            {/* End Date & Time Toggle */}
            {!showEnd ? (
              <button
                type="button"
                onClick={() => setShowEnd(true)}
                className="text-blue-600 hover:text-blue-800 font-bold"
              >
                + Add end date/time
              </button>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm font-bold">End</div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEnd(false);
                      setValue('end_date', '');
                      setValue('end_time', '');
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    min={watch('start_date') || today}
                    {...register('end_date')}
                    className="flex-1 border-2 border-black rounded-none px-4 py-3 font-mono focus:outline-none focus:bg-yellow-100"
                  />
                  <Controller
                    name="end_time"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        placeholder="22:00"
                        maxLength={5}
                        {...field}
                        onChange={e => field.onChange(formatTimeInput(e.target.value))}
                        className="w-24 border-2 border-black rounded-none px-4 py-3 text-center font-mono focus:outline-none focus:bg-yellow-100"
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Guest Limit */}
          {/* <div>
            <label htmlFor="guest_limit" className="block mb-2 text-lg font-bold">👥 Guest Limit (Optional)</label>
            <input
              id="guest_limit"
              type="number"
              placeholder="Maximum number of attendees"
              min="1"
              {...register('guest_limit', { min: 1 })}
              className="w-full border-2 border-black rounded-none px-4 py-3 text-lg font-mono focus:outline-none focus:bg-yellow-100"
            />
            <p className="text-sm text-gray-600 mt-1">Leave empty for unlimited guests</p>
          </div> */}

          {/* Visibility */}
          {/* <div>
            <label className="block mb-2 text-lg font-bold">👁️ Who can see this?</label>
            <div className="flex gap-0">
              <label className="flex-1">
                <input
                  type="radio"
                  value="PUBLIC"
                  {...register('visibility', { required: true })}
                  className="sr-only"
                />
                <div className={`border-2 border-black rounded-none px-4 py-3 text-center font-bold cursor-pointer transition-colors ${
                  watch('visibility') === 'PUBLIC' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}>
                  🌍 Public
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  value="FRIENDS"
                  {...register('visibility', { required: true })}
                  className="sr-only"
                />
                <div className={`border-2 border-black rounded-none px-4 py-3 text-center font-bold cursor-pointer transition-colors ${
                  watch('visibility') === 'FRIENDS' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}>
                  👥 Friends
                </div>
              </label>
            </div>
          </div> */}

          {/* Location */}
          <div>
            <label htmlFor="location" className="block mb-2 text-lg font-bold">📍 Where</label>
            <input
              id="location"
              type="text"
              placeholder="Event location"
              {...register('location')}
              className="w-full border-2 border-black rounded-none px-4 py-3 text-lg font-mono focus:outline-none focus:bg-yellow-100"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block mb-2 text-lg font-bold">Description</label>
            <textarea
              id="description"
              placeholder="What's this event about?"
              {...register('description')}
              className="w-full border-2 border-black rounded-none px-4 py-3 h-24 resize-none font-mono focus:outline-none focus:bg-yellow-100"
            />
          </div>
        </form>
      </div>

      {/* Sticky Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-4 border-black">
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onCancel}
            fullWidth={false}
            size="lg"
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !isFormReady}
            onClick={handleSubmit(onSubmit)}
            fullWidth={false}
            size="lg"
            variant="primary"
            inactive={!isFormReady && !loading}
            className="flex-1"
          >
            {loading ? '⏳ Updating...' : isFormReady ? 'UPDATE EVENT' : 'Fill required fields'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditEventForm;