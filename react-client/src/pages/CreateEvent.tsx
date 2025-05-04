// // react-client/src/pages/CreateEvent.tsx
// import React, { useState } from 'react';
// import { useForm, Controller } from 'react-hook-form';
// import { useNavigate } from 'react-router-dom';
// import { post, apiClient } from '../api/client';
// import { getStoredToken } from '../utils/tokenStorage';

// type FormData = {
//   title: string;
//   description: string;
//   start_date: string;
//   start_time?: string;
//   end_date?: string;
//   end_time?: string;
//   place: string;
//   cover?: FileList;
// };

// const CreateEvent: React.FC = () => {
//   const {
//     register,
//     handleSubmit,
//     control,
//     watch,
//     setValue,
//     formState: { errors }
//   } = useForm<FormData>();
//   const [coverPreview, setCoverPreview] = useState<string | null>(null);
//   const [showEnd, setShowEnd] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const today = new Date().toISOString().slice(0, 10);

//   // Cover-Vorschau
//   const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;
//     setValue('cover', files);
//     setCoverPreview(URL.createObjectURL(files[0]));
//   };

//   const onSubmit = async (data: FormData) => {
//     setLoading(true);
//     try {
//       // 1) Cover hochladen
//       let image_url = '';
//       if (data.cover && data.cover.length) {
//         const form = new FormData();
//         form.append('file', data.cover[0]);
//         const resp = await apiClient.post<{ file_url: string }>(
//           '/events/upload/',
//           form,
//           {
//             headers: {
//               'Content-Type': 'multipart/form-data',
//               Authorization: `Bearer ${getStoredToken()}`,
//             },
//           }
//         );
//         image_url = resp.data.file_url;
//       }

//       // 2) Payload zusammenbauen
//       const payload = {
//         title:       data.title,
//         description: data.description,
//         start_date:  data.start_date,
//         start_time:  data.start_time,
//         end_date:    showEnd ? data.end_date : undefined,
//         end_time:    showEnd ? data.end_time : undefined,
//         place:       data.place,
//         image_url,
//       };

//       // 3) Event anlegen
//       await post('/events', payload);

//       alert('✔️ Veranstaltung erstellt!');
//       navigate('/events');
//     } catch (err) {
//       console.error(err);
//       alert('❌ Konnte Veranstaltung nicht erstellen.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Hilfsfunktion: formatiert Eingabe “HHMM” → “HH:MM”
//   const formatTimeInput = (raw: string) => {
//     const digits = raw.replace(/\D/g, '').slice(0, 4);
//     if (digits.length <= 2) return digits;
//     return digits.slice(0, 2) + ':' + digits.slice(2);
//   };

//   return (
//     <div className="max-w-md mx-auto bg-gray-900 text-white p-4 space-y-6 rounded-lg">
//       {/* Cover-Upload */}
//       <div className="relative h-36 bg-gray-800 rounded overflow-hidden">
//         {coverPreview
//           ? <img src={coverPreview} className="object-cover w-full h-full" />
//           : <div className="flex items-center justify-center h-full text-gray-500">
//               + Foto/Video hinzufügen
//             </div>
//         }
//         <input
//           type="file"
//           accept="image/*"
//           onChange={onCoverChange}
//           className="absolute inset-0 opacity-0 cursor-pointer"
//         />
//       </div>

//       {/* Formular */}
//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         {/* Titel */}
//         <input
//           type="text"
//           placeholder="Name der Veranstaltung"
//           {...register('title', { required: true })}
//           className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
//         />
//         {errors.title && <p className="text-red-500 text-xs">Pflichtfeld</p>}

//         {/* Datum & Zeit */}
//         <div className="flex space-x-2 items-center">
//           <input
//             type="date"
//             defaultValue={today}
//             {...register('start_date', { required: true })}
//             className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2"
//           />
//           <Controller
//             name="start_time"
//             control={control}
//             defaultValue=""
//             render={({ field }) => (
//               <input
//                 type="text"
//                 placeholder="HH:MM"
//                 maxLength={5}
//                 {...field}
//                 onChange={e => field.onChange(formatTimeInput(e.target.value))}
//                 className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-center"
//               />
//             )}
//           />
//         </div>
//         {errors.start_date && <p className="text-red-500 text-xs">Pflichtfeld</p>}

//         {/* Enddatum/Uhrzeit */}
//         {!showEnd
//           ? <button
//               type="button"
//               onClick={() => setShowEnd(true)}
//               className="text-blue-500 text-sm"
//             >
//               + Enddatum und Uhrzeit
//             </button>
//           : (
//             <div className="flex space-x-2 items-center">
//               <input
//                 type="date"
//                 {...register('end_date')}
//                 className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2"
//               />
//               <Controller
//                 name="end_time"
//                 control={control}
//                 defaultValue=""
//                 render={({ field }) => (
//                   <input
//                     type="text"
//                     placeholder="HH:MM"
//                     maxLength={5}
//                     {...field}
//                     onChange={e => field.onChange(formatTimeInput(e.target.value))}
//                     className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-center"
//                   />
//                 )}
//               />
//             </div>
//           )
//         }

//         {/* Ort */}
//         <input
//           type="text"
//           placeholder="Ort hinzufügen"
//           {...register('place', { required: true })}
//           className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
//         />
//         {errors.place && <p className="text-red-500 text-xs">Pflichtfeld</p>}

//         {/* Details */}
//         <textarea
//           placeholder="Was sind die Details?"
//           {...register('description')}
//           rows={4}
//           className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 resize-none"
//         />

//         {/* Absenden */}
//         <button
//           type="submit"
//           disabled={loading}
//           className={`w-full py-2 rounded ${
//             loading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
//           }`}
//         >
//           {loading ? 'Erstelle…' : 'Veranstaltung erstellen'}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default CreateEvent;
