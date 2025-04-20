import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import { get, put } from '../api/client';
import { User } from '../types';
import { uploadProfilePicture } from '../api/profileApi';

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const userData = await get<User>('/users/me');
        setProfileData(userData);
        
        // Initialize form fields
        setFirstName(userData.first_name || '');
        setLastName(userData.last_name || '');
        setUsername(userData.username || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Update profile
      const updatedProfile = await put<User>('/users/me', {
        first_name: firstName,
        last_name: lastName,
        username: username !== profileData?.username ? username : undefined
      });
      
      setProfileData(updatedProfile);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      
      // Use your existing API function instead of fetch
      const updatedUser = await uploadProfilePicture(selectedFile);
      setProfileData(updatedUser);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      // Access error details from axios error structure
      setError(error.response?.data?.detail || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };
  
  if (isLoading && !profileData) {
    return <div className="p-4 text-center">Loading profile...</div>;
  }
  
  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      <div className="my-8">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Picture Section */}
          <div className="md:w-1/3">
            <div className="border border-gray-300 p-4 rounded">
              {profileData?.profile_picture ? (
                <img 
                  src={profileData.profile_picture} 
                  alt="Profile" 
                  className="w-full h-auto rounded mb-4"
                />
              ) : (
                <div className="bg-gray-200 w-full aspect-square flex items-center justify-center rounded mb-4">
                  <span className="text-gray-500 text-5xl font-bold">
                    {profileData?.first_name?.[0] || profileData?.username?.[0] || '?'}
                  </span>
                </div>
              )}
              
              <div className="mt-4">
                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mb-2"
                />
                
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || uploading}
                  className="border border-gray-500 bg-gray-200 px-4 py-1 w-full hover:bg-gray-300 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload New Picture'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Profile Info Section */}
          <div className="md:w-2/3">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="border border-gray-300 p-4 rounded">
                <div className="mb-4">
                  <label htmlFor="first-name" className="block mb-1 font-bold">First Name:</label>
                  <input
                    id="first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border border-gray-500 p-2 w-full"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="last-name" className="block mb-1 font-bold">Last Name:</label>
                  <input
                    id="last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border border-gray-500 p-2 w-full"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="username" className="block mb-1 font-bold">Username:</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border border-gray-500 p-2 w-full"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form values
                      setFirstName(profileData?.first_name || '');
                      setLastName(profileData?.last_name || '');
                      setUsername(profileData?.username || '');
                    }}
                    className="border border-gray-500 bg-gray-200 px-4 py-1 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="border border-blue-500 bg-blue-100 px-4 py-1 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="border border-gray-300 p-4 rounded">
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-2">
                    {profileData?.first_name && profileData?.last_name
                      ? `${profileData.first_name} ${profileData.last_name}`
                      : profileData?.username || 'No name set'}
                  </h2>
                  
                  <p className="text-gray-600">@{profileData?.username}</p>
                  <p>{profileData?.email}</p>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="border border-gray-500 bg-gray-200 px-4 py-1 hover:bg-gray-300"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;