// react-client/src/pages/RequestForComment.tsx
// Fixed version - no more flash on navigation

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
    try {
      const rfcData = await getRFCData();
      setData(rfcData);
      await fetchUpdatedComments();
    } catch (err) {
      console.error('Error updating data:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // SINGLE RETURN - maintains consistent DOM structure, no flash
  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      <div className="space-y-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center p-8">
            <div className="text-lg">Loading...</div>
            <div className="mt-4 space-y-3">
              {/* Loading skeleton */}
              <div className="h-8 bg-gray-200 rounded animate-pulse mx-auto max-w-md"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center text-red-600 p-8">
            <p className="text-lg mb-4">{error}</p>
            <button 
              onClick={fetchInitialData}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Content - only show when data is loaded and no error */}
        {!isLoading && !error && data && (
          <>
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
          </>
        )}

        {/* No Data State */}
        {!isLoading && !error && !data && (
          <div className="text-center p-8">
            <p className="text-lg text-gray-600">No data available</p>
            <button 
              onClick={fetchInitialData}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestForComment;