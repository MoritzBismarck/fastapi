// react-client/src/components/CreateEventForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { apiClient } from '../api/client';
import { getStoredToken } from '../utils/tokenStorage';
import { post } from '../api/client';
import imageCompression from 'browser-image-compression';
import Button from './Button';

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
  visibility: 'PUBLIC' | 'FRIENDS';
};

const CreateEventForm: React.FC<CreateEventFormProps> = ({ onEventCreated, onCancel }) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      visibility: 'PUBLIC'
    }
  });
  
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Watch all required fields for button glow
  const watchedFields = watch(['title', 'start_date', 'location', 'description', 'visibility']);
  const [title, startDate, location, description, visibility] = watchedFields;

  // Check if all required fields are filled
  const isFormReady = !!(
    coverFile && 
    title && 
    startDate && 
    // location && 
    // description && 
    visibility
  );

  const today = new Date().toISOString().split('T')[0];

  // Cover preview handler
  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setValue('cover', files);
      setCoverFile(files[0]);
      setCoverPreview(URL.createObjectURL(files[0]));
    } catch (error) {
      console.error('Error creating cover preview:', error);
      alert('❌ Could not create cover preview.');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 1) Upload cover photo
      let image_url = '';
      
      if (coverFile) {
        const options = {
          maxSizeMB: 3,
          maxWidthOrHeight: 1200,
          useWebWorker: true
        };
        
        const compressedFile = await imageCompression(coverFile, options);
        
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
      const payload: any = {
        title: data.title,
        description: data.description,
        start_date: data.start_date,
        start_time: data.start_time || undefined,
        end_date: showEnd ? data.end_date : undefined,
        end_time: showEnd ? data.end_time : undefined,
        location: data.location,
        cover_photo_url: image_url,
        guest_limit: data.guest_limit ? Number(data.guest_limit) : undefined,
        visibility: data.visibility
      };

      // 3) Create event
      await post('/events', payload);

      alert('✔️ Event created successfully!');
      onEventCreated();
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
    <div className="min-h-screen bg-white pb-24">

      {/* Scrollable Content */}
      <div className="p-4 space-y-6">
        
        {/* Cover Photo - Big focal point */}
        <div className="relative">
          <div className="relative h-80 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            {coverPreview ? (
              <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-4xl mb-2">📷</div>
                <div className="text-lg font-bold">Add Cover Photo</div>
                <div className="text-sm">Tap to upload</div>
              </div>
            )}
          </div>
          
          <input
            type="file"
            accept="image/*"
            onChange={onCoverChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Event Title */}
          <div>
            <label htmlFor="title" className="block mb-2 text-lg font-bold">Event Title</label>
            <input
              id="title"
              type="text"
              placeholder="What's the event called?"
              {...register('title', { required: true })}
              className="w-full border-2 border-black rounded-none px-4 py-3 text-lg font-mono focus:outline-none focus:bg-yellow-100"
            />
          </div>

          {/* Date & Time */}
          <div>
            <label className="block mb-2 text-lg font-bold">📅 When</label>
            <div className="space-y-3">
              <div className="flex space-x-2">
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
                      placeholder="HH:MM"
                      maxLength={5}
                      {...field}
                      onChange={e => field.onChange(formatTimeInput(e.target.value))}
                      className="w-28 border-2 border-black rounded-none px-3 py-3 text-center font-mono focus:outline-none focus:bg-yellow-100"
                    />
                  )}
                />
              </div>
              
              {/* End date/time toggle */}
              {!showEnd ? (
                <button
                  type="button"
                  onClick={() => setShowEnd(true)}
                  className="text-blue-600 text-sm font-bold underline"
                >
                  + Add end date/time
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-gray-600">End</div>
                  <div className="flex space-x-2 items-center">
                    <input
                      type="date"
                      min={today}
                      {...register('end_date')}
                      className="flex-1 border-2 border-gray-400 rounded-none px-4 py-3 font-mono focus:outline-none focus:bg-yellow-100"
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
                          className="w-28 border-2 border-gray-400 rounded-none px-3 py-3 text-center font-mono focus:outline-none focus:bg-yellow-100"
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEnd(false)}
                      className="text-red-600 text-sm font-bold px-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block mb-2 text-lg font-bold">👁️ Who can see this</label>
            <div className="flex space-x-2">
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
          </div>

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

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-4 border-black">
        <Button
          type="submit"
          disabled={loading || !isFormReady}
          onClick={handleSubmit(onSubmit)}
          fullWidth={true}
          size="lg"
          variant="primary"
          inactive={!isFormReady && !loading}
        >
          {loading ? '⏳ Creating...' : isFormReady ? 'CREATE EVENT' : 'Fill out event details'}
        </Button>
      </div>
    </div>
  );
};

export default CreateEventForm;