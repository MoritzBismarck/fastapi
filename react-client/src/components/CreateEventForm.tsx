// src/components/CreateEventForm.tsx
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { post, apiClient } from '../api/client';
import { getStoredToken } from '../utils/tokenStorage';

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
  place: string;
  cover?: FileList;
};

const CreateEventForm: React.FC<CreateEventFormProps> = ({ onEventCreated, onCancel }) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<FormData>();
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Cover preview handler
  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setValue('cover', files);
    setCoverPreview(URL.createObjectURL(files[0]));
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 1) Upload cover
      let image_url = '';
      if (data.cover && data.cover.length) {
        const form = new FormData();
        form.append('file', data.cover[0]);
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
        title:       data.title,
        description: data.description,
        start_date:  data.start_date,
        start_time:  data.start_time,
        end_date:    showEnd ? data.end_date : undefined,
        end_time:    showEnd ? data.end_time : undefined,
        place:       data.place,
        image_url,
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
    <div className="bg-white border border-gray-300 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Create New Event</h2>
      
      {/* Cover upload */}
      <div className="relative h-36 bg-gray-100 rounded overflow-hidden mb-4">
        {coverPreview
          ? <img src={coverPreview} alt="Cover preview" className="object-cover w-full h-full" />
          : <div className="flex items-center justify-center h-full text-gray-500">
              + Add photo/image
            </div>
        }
        <input
          type="file"
          accept="image/*"
          onChange={onCoverChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
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

        {/* Date & Time */}
        <div>
          <label className="block mb-1 font-bold">Start Date & Time:</label>
          <div className="flex space-x-2 items-center">
            <input
              type="date"
              defaultValue={today}
              {...register('start_date', { required: true })}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            />
            <Controller
              name="start_time"
              control={control}
              defaultValue=""
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
        {!showEnd
          ? <button
              type="button"
              onClick={() => setShowEnd(true)}
              className="text-blue-500 text-sm"
            >
              + Add end date and time
            </button>
          : (
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
                  defaultValue=""
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
            </div>
          )
        }

        {/* Place */}
        <div>
          <label htmlFor="place" className="block mb-1 font-bold">Location:</label>
          <input
            id="place"
            type="text"
            placeholder="Add location"
            {...register('place', { required: true })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          {errors.place && <p className="text-red-500 text-xs">Required field</p>}
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