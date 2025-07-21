// Create new file: react-client/src/components/FeatureWishlist.tsx

import React, { useState } from 'react';
import { Feature, UserVoteSummary, CreateFeatureRequest } from '../types/index';
import { voteForFeature, removeVoteFromFeature, createFeature } from '../api/rfcApi';
import Button from './Button';

interface FeatureWishlistProps {
  features: Feature[];
  userVoteSummary: UserVoteSummary;
  onUpdate: () => void;
}

const FeatureWishlist: React.FC<FeatureWishlistProps> = ({
  features,
  userVoteSummary,
  onUpdate
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFeature, setNewFeature] = useState<CreateFeatureRequest>({
    title: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingFeatureId, setVotingFeatureId] = useState<number | null>(null);

  const handleVote = async (featureId: number, hasVoted: boolean) => {
    setVotingFeatureId(featureId);
    try {
      if (hasVoted) {
        await removeVoteFromFeature(featureId);
      } else {
        await voteForFeature(featureId);
      }
      onUpdate();
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVotingFeatureId(null);
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeature.title.trim() || !newFeature.description.trim()) return;

    setIsSubmitting(true);
    try {
      await createFeature(newFeature);
      setNewFeature({ title: '', description: '' });
      setIsCreating(false);
      onUpdate();
    } catch (error) {
      console.error('Error creating feature:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Feature Wishlist</h2>
          <p className="text-sm text-gray-600">
            {userVoteSummary.remaining_votes} vote{userVoteSummary.remaining_votes !== 1 ? 's' : ''} remaining 
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(!isCreating)}
          variant="secondary"
          size="sm"
        >
          {isCreating ? 'Cancel' : 'Add Feature'}
        </Button>
      </div>

      {/* Create Feature Form */}
      {isCreating && (
        <div className="border-2 border-gray-300 p-4 rounded">
          <h3 className="font-bold mb-2">Add New Feature</h3>
          <form onSubmit={handleCreateFeature} className="space-y-2">
            <input
              type="text"
              placeholder="Feature title"
              value={newFeature.title}
              onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
              className="w-full p-2 border-2 border-gray-300 rounded font-mono"
              required
            />
            <textarea
              placeholder="Feature description"
              value={newFeature.description}
              onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
              className="w-full p-2 border-2 border-gray-300 rounded font-mono resize-none"
              rows={3}
              required
            />
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                size="sm"
              >
                {isSubmitting ? 'Creating...' : 'Create Feature'}
              </Button>
              <Button 
                type="button"
                onClick={() => setIsCreating(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Features List */}
      <div className="space-y-2">
        {features.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No features yet. Be the first to add one!</p>
        ) : (
          features.map((feature) => (
            <div
              key={feature.id}
              className={`border-2 p-3 rounded ${
                feature.user_has_voted ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">{feature.vote_count}</div>
                    <div className="text-xs text-gray-500">
                      vote{feature.vote_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleVote(feature.id, feature.user_has_voted)}
                    disabled={
                      votingFeatureId === feature.id ||
                      (!feature.user_has_voted && userVoteSummary.remaining_votes === 0)
                    }
                    variant={feature.user_has_voted ? 'secondary' : 'primary'}
                    size="sm"
                  >
                    {votingFeatureId === feature.id ? (
                      '...'
                    ) : feature.user_has_voted ? (
                      '👍 Voted'
                    ) : userVoteSummary.remaining_votes === 0 ? (
                      'No votes left'
                    ) : (
                      '👍 Vote'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeatureWishlist;