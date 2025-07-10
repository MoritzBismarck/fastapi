// Create react-client/src/components/MatchPopup.tsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface MatchPopupProps {
  matches: Array<{
    match_id: number;
    friend: {
      id: number;
      username: string;
      profile_picture?: string;
    };
    event: {
      id: number;
      title: string;
    };
  }>;
  onClose: () => void;
}

const MatchPopup: React.FC<MatchPopupProps> = ({ matches, onClose }) => {
  const navigate = useNavigate();

  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (matches.length === 0) return null;

  const handleChatClick = () => {
    // Navigate to matched events page where they can see the chat
    navigate('/events/matches');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
        <h2 className="text-2xl font-bold mb-4 text-green-600">
          🎉 It's a Match!
        </h2>
        
        {matches.map((match, index) => (
          <div key={match.match_id} className="mb-4">
            <div className="flex items-center justify-center space-x-4 mb-2">
              {/* Friend's profile picture */}
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                {match.friend.profile_picture ? (
                  <img 
                    src={match.friend.profile_picture} 
                    alt={match.friend.username}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold">
                    {match.friend.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-lg font-semibold mb-1">
              You and {match.friend.username} both liked
            </p>
            <p className="text-gray-600 font-mono">
              "{match.event.title}"
            </p>
          </div>
        ))}
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleChatClick}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-mono"
          >
            Chat About Event
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 font-mono"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchPopup;