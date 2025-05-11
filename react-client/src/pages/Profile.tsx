import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Button from '../components/Button'; // Import our new Button component
import { get, put } from '../api/client';
import { User } from '../types';
import { uploadProfilePicture } from '../api/profileApi';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
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
      
      // Compression options
      const options = {
        maxSizeMB: 4,
        // maxWidthOrHeight: 1024,
        useWebWorker: true
      };
      
      // Compress the image before uploading
      const compressedFile = await imageCompression(selectedFile, options);
      
      // Log compression results for debugging
      console.log('Original size:', selectedFile.size / 1024, 'KB');
      console.log('Compressed size:', compressedFile.size / 1024, 'KB');
      
      const updatedUser = await uploadProfilePicture(compressedFile);
      setProfileData(updatedUser);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      setError(error.response?.data?.detail || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };
  
  // Format the creation date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleLogout = async () => {
    await logout();
    // After logout, redirect to login page
    navigate('/');
  };

  if (isLoading && !profileData) {
    return <div className="p-4 text-center">Loading profile...</div>;
  }
  
  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="mt-8">
          <h2 className="text-xl mb-4">Edit Profile</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="profile-picture" className="block mb-2">Profile Picture:</label>
              <input
                type="file"
                id="profile-picture"
                accept="image/*"
                onChange={handleFileChange}
                className="mb-2"
              />
              
              <Button
                type="button"
                onClick={handleFileUpload}
                disabled={!selectedFile || uploading}
                size="sm"
              >
                {uploading ? 'Uploading...' : 'Upload Picture'}
              </Button>
            </div>
            
            <div className="mb-4">
              <label htmlFor="username" className="block mb-2">Username:</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border border-gray-500 p-1 w-full"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="first-name" className="block mb-2">First Name:</label>
              <input
                id="first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border border-gray-500 p-1 w-full"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="last-name" className="block mb-2">Last Name:</label>
              <input
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border border-gray-500 p-1 w-full"
              />
            </div>
            
            <div className="mt-6 flex space-x-4">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mt-8 p-8 flex flex-col items-center">
          {/* Prominent profile picture */}
          {profileData?.profile_picture ? (
            <img 
              src={profileData.profile_picture} 
              alt="Profile" 
              className="w-90 h-90 mb-6"
            />
          ) : (
            <div className="w-64 h-64 bg-gray-200 flex items-center justify-center mb-6">
              <span className="text-black text-8xl font-bold">
                {profileData?.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          
          {/* Profile info */}
          <div className="text-center">
            <p className="text-xl font-bold mb-2">@{profileData?.username || 'username'}</p>
            
            <p className="text-xl mb-2">
              {profileData?.first_name && profileData?.last_name
                ? `${profileData.first_name} ${profileData.last_name}`
                : 'No name set'}
            </p>
            
            <p className="mb-2">{profileData?.email}</p>
            
            <p className="mb-6">Created at: {formatDate(profileData?.created_at)}</p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="secondary"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;