// Create new file: react-client/src/pages/RequestForComment.tsx

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import FeatureWishlist from '../components/FeatureWishlist';
import CommentSystem from '../components/CommentSystem';
import { RequestForCommentData, Comment } from '../types/index';
import { getRFCData, getComments } from '../api/rfcApi';

const RequestForComment: React.FC = () => {
  const [data, setData] = useState<RequestForCommentData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rfcData = await getRFCData();
      setData(rfcData);
      setComments(rfcData.comments);
    } catch (err) {
      console.error('Error fetching RFC data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpdatedComments = async () => {
    try {
      const updatedComments = await getComments();
      setComments(updatedComments);
    } catch (err) {
      console.error('Error fetching updated comments:', err);
    }
  };

  const handleUpdate = async () => {
    // Refresh features and vote summary
    try {
      const rfcData = await getRFCData();
      setData(rfcData);
      // Also refresh comments to get latest replies
      await fetchUpdatedComments();
    } catch (err) {
      console.error('Error updating data:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen font-mono">
        <Header />
        <div className="p-4 text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen font-mono">
        <Header />
        <div className="p-4 text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={fetchInitialData}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen font-mono">
        <Header />
        <div className="p-4 text-center">No data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-mono">
      <Header />
      
      <div className="p-4 max-w-4xl mx-auto space-y-8">
        {/* Page Title */}
        <div className="text-left">
          <h1 className="text-2xl font-bold underline decoration-2">Request for Comment</h1>
        </div>

        {/* Feature Wishlist Section */}
        <section>
          <FeatureWishlist
            features={data.features}
            userVoteSummary={data.user_vote_summary}
            onUpdate={handleUpdate}
          />
        </section>

        {/* Divider */}
        <div className="border-t-2 border-gray-300 my-8"></div>

        {/* Comments Section */}
        <section>
          <CommentSystem
            comments={comments}
            onUpdate={handleUpdate}
          />
        </section>
      </div>
    </div>
  );
};

export default RequestForComment;