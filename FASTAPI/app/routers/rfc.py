# Create new file: FASTAPI/app/routers/rfc.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, and_
from typing import List
from .. import models, schemas, oauth2
from ..database import get_db

router = APIRouter(
    prefix="/rfc",
    tags=["request-for-comment"]
)

# ============= FEATURE WISHLIST ENDPOINTS =============

@router.get("/features", response_model=List[schemas.FeatureResponse])
def get_features(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Get all features sorted by vote count (most voted first)"""
    
    # Get all features with vote counts
    features = db.query(models.Feature).order_by(desc(models.Feature.vote_count)).all()
    
    # Get user's current votes to mark which features they've voted for
    user_votes = db.query(models.FeatureVote.feature_id).filter(
        models.FeatureVote.user_id == current_user.id
    ).all()
    user_voted_feature_ids = {vote[0] for vote in user_votes}
    
    # Build response with user voting status
    feature_responses = []
    for feature in features:
        feature_dict = {
            "id": feature.id,
            "title": feature.title,
            "description": feature.description,
            "vote_count": feature.vote_count,
            "created_at": feature.created_at,
            "updated_at": feature.updated_at,
            "created_by": feature.created_by,
            "user_has_voted": feature.id in user_voted_feature_ids
        }
        feature_responses.append(schemas.FeatureResponse(**feature_dict))
    
    return feature_responses

@router.get("/features/user-votes", response_model=schemas.UserVoteSummary)
def get_user_vote_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Get user's current voting status"""
    
    # Count user's current votes
    user_votes = db.query(models.FeatureVote).filter(
        models.FeatureVote.user_id == current_user.id
    ).all()
    
    total_votes = len(user_votes)
    remaining_votes = max(0, 2 - total_votes)  # Max 2 votes per user
    voted_features = [vote.feature_id for vote in user_votes]
    
    return schemas.UserVoteSummary(
        total_votes=total_votes,
        remaining_votes=remaining_votes,
        voted_features=voted_features
    )

@router.post("/features/{feature_id}/vote", response_model=schemas.FeatureVoteResponse)
def vote_for_feature(
    feature_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Vote for a feature (max 2 votes per user)"""
    
    # Check if feature exists
    feature = db.query(models.Feature).filter(models.Feature.id == feature_id).first()
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature with id {feature_id} not found"
        )
    
    # Check if user already voted for this feature
    existing_vote = db.query(models.FeatureVote).filter(
        and_(
            models.FeatureVote.user_id == current_user.id,
            models.FeatureVote.feature_id == feature_id
        )
    ).first()
    
    if existing_vote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already voted for this feature"
        )
    
    # Check if user has reached vote limit (2 votes)
    user_vote_count = db.query(models.FeatureVote).filter(
        models.FeatureVote.user_id == current_user.id
    ).count()
    
    if user_vote_count >= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have reached the maximum number of votes (2)"
        )
    
    # Create the vote
    new_vote = models.FeatureVote(
        user_id=current_user.id,
        feature_id=feature_id
    )
    
    db.add(new_vote)
    
    # Update feature vote count
    feature.vote_count += 1
    
    db.commit()
    db.refresh(new_vote)
    
    return new_vote

@router.delete("/features/{feature_id}/vote")
def remove_vote_from_feature(
    feature_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Remove vote from a feature"""
    
    # Find the vote
    vote = db.query(models.FeatureVote).filter(
        and_(
            models.FeatureVote.user_id == current_user.id,
            models.FeatureVote.feature_id == feature_id
        )
    ).first()
    
    if not vote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vote not found"
        )
    
    # Get the feature and decrease vote count
    feature = db.query(models.Feature).filter(models.Feature.id == feature_id).first()
    if feature:
        feature.vote_count = max(0, feature.vote_count - 1)
    
    # Delete the vote
    db.delete(vote)
    db.commit()
    
    return {"message": "Vote removed successfully"}

# Admin endpoint to create features (you can restrict this later)
@router.post("/features", response_model=schemas.FeatureResponse, status_code=status.HTTP_201_CREATED)
def create_feature(
    feature: schemas.FeatureCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Create a new feature (admin only for now)"""
    
    new_feature = models.Feature(
        **feature.model_dump(),
        created_by=current_user.id
    )
    
    db.add(new_feature)
    db.commit()
    db.refresh(new_feature)
    
    # Convert to response format
    feature_dict = {
        "id": new_feature.id,
        "title": new_feature.title,
        "description": new_feature.description,
        "vote_count": new_feature.vote_count,
        "created_at": new_feature.created_at,
        "updated_at": new_feature.updated_at,
        "created_by": new_feature.created_by,
        "user_has_voted": False  # Creator hasn't voted yet
    }
    
    return schemas.FeatureResponse(**feature_dict)

# ============= COMMENT SYSTEM ENDPOINTS =============

@router.get("/comments", response_model=List[schemas.CommentResponse])
def get_comments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Get all comments with their replies, sorted by creation date (newest first)"""
    
    # Get comments with author info
    comments = db.query(models.Comment).options(
        joinedload(models.Comment.author)
    ).order_by(desc(models.Comment.created_at)).all()
    
    # Get user's comment likes
    user_comment_likes = db.query(models.CommentLike.comment_id).filter(
        models.CommentLike.user_id == current_user.id
    ).all()
    user_liked_comment_ids = {like[0] for like in user_comment_likes}
    
    # Get user's reply likes
    user_reply_likes = db.query(models.CommentReplyLike.reply_id).filter(
        models.CommentReplyLike.user_id == current_user.id
    ).all()
    user_liked_reply_ids = {like[0] for like in user_reply_likes}
    
    # Build response
    comment_responses = []
    for comment in comments:
        # Get replies for this comment
        replies = db.query(models.CommentReply).options(
            joinedload(models.CommentReply.author)
        ).filter(
            models.CommentReply.comment_id == comment.id
        ).order_by(models.CommentReply.created_at).all()
        
        # Build reply responses
        reply_responses = []
        for reply in replies:
            reply_dict = {
                "id": reply.id,
                "content": reply.content,
                "comment_id": reply.comment_id,
                "author_id": reply.author_id,
                "like_count": reply.like_count,
                "created_at": reply.created_at,
                "updated_at": reply.updated_at,
                "author": {
                    "id": reply.author.id,
                    "username": reply.author.username,
                    "profile_picture": reply.author.profile_picture
                },
                "user_has_liked": reply.id in user_liked_reply_ids
            }
            reply_responses.append(schemas.CommentReplyResponse(**reply_dict))
        
        # Build comment response
        comment_dict = {
            "id": comment.id,
            "content": comment.content,
            "author_id": comment.author_id,
            "like_count": comment.like_count,
            "reply_count": comment.reply_count,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
            "author": {
                "id": comment.author.id,
                "username": comment.author.username,
                "profile_picture": comment.author.profile_picture
            },
            "user_has_liked": comment.id in user_liked_comment_ids,
            "replies": reply_responses
        }
        comment_responses.append(schemas.CommentResponse(**comment_dict))
    
    return comment_responses

@router.post("/comments", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Create a new comment"""
    
    new_comment = models.Comment(
        content=comment.content,
        author_id=current_user.id
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Load author info
    comment_with_author = db.query(models.Comment).options(
        joinedload(models.Comment.author)
    ).filter(models.Comment.id == new_comment.id).first()
    
    # Build response
    comment_dict = {
        "id": comment_with_author.id,
        "content": comment_with_author.content,
        "author_id": comment_with_author.author_id,
        "like_count": comment_with_author.like_count,
        "reply_count": comment_with_author.reply_count,
        "created_at": comment_with_author.created_at,
        "updated_at": comment_with_author.updated_at,
        "author": {
            "id": comment_with_author.author.id,
            "username": comment_with_author.author.username,
            "profile_picture": comment_with_author.author.profile_picture
        },
        "user_has_liked": False,  # User hasn't liked their own comment yet
        "replies": []
    }
    
    return schemas.CommentResponse(**comment_dict)

@router.post("/comments/{comment_id}/replies", response_model=schemas.CommentReplyResponse, status_code=status.HTTP_201_CREATED)
def create_comment_reply(
    comment_id: int,
    reply: schemas.CommentReplyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Create a reply to a comment"""
    
    # Check if comment exists
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with id {comment_id} not found"
        )
    
    # Create the reply
    new_reply = models.CommentReply(
        content=reply.content,
        comment_id=comment_id,
        author_id=current_user.id
    )
    
    db.add(new_reply)
    
    # Update comment reply count
    comment.reply_count += 1
    
    db.commit()
    db.refresh(new_reply)
    
    # Load author info
    reply_with_author = db.query(models.CommentReply).options(
        joinedload(models.CommentReply.author)
    ).filter(models.CommentReply.id == new_reply.id).first()
    
    # Build response
    reply_dict = {
        "id": reply_with_author.id,
        "content": reply_with_author.content,
        "comment_id": reply_with_author.comment_id,
        "author_id": reply_with_author.author_id,
        "like_count": reply_with_author.like_count,
        "created_at": reply_with_author.created_at,
        "updated_at": reply_with_author.updated_at,
        "author": {
            "id": reply_with_author.author.id,
            "username": reply_with_author.author.username,
            "profile_picture": reply_with_author.author.profile_picture
        },
        "user_has_liked": False  # User hasn't liked their own reply yet
    }
    
    return schemas.CommentReplyResponse(**reply_dict)

@router.post("/comments/{comment_id}/like")
def like_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Like or unlike a comment"""
    
    # Check if comment exists
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with id {comment_id} not found"
        )
    
    # Check if user already liked this comment
    existing_like = db.query(models.CommentLike).filter(
        and_(
            models.CommentLike.user_id == current_user.id,
            models.CommentLike.comment_id == comment_id
        )
    ).first()
    
    if existing_like:
        # Unlike the comment
        db.delete(existing_like)
        comment.like_count = max(0, comment.like_count - 1)
        db.commit()
        return {"message": "Comment unliked", "liked": False}
    else:
        # Like the comment
        new_like = models.CommentLike(
            user_id=current_user.id,
            comment_id=comment_id
        )
        db.add(new_like)
        comment.like_count += 1
        db.commit()
        return {"message": "Comment liked", "liked": True}

@router.post("/replies/{reply_id}/like")
def like_reply(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Like or unlike a reply"""
    
    # Check if reply exists
    reply = db.query(models.CommentReply).filter(models.CommentReply.id == reply_id).first()
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reply with id {reply_id} not found"
        )
    
    # Check if user already liked this reply
    existing_like = db.query(models.CommentReplyLike).filter(
        and_(
            models.CommentReplyLike.user_id == current_user.id,
            models.CommentReplyLike.reply_id == reply_id
        )
    ).first()
    
    if existing_like:
        # Unlike the reply
        db.delete(existing_like)
        reply.like_count = max(0, reply.like_count - 1)
        db.commit()
        return {"message": "Reply unliked", "liked": False}
    else:
        # Like the reply
        new_like = models.CommentReplyLike(
            user_id=current_user.id,
            reply_id=reply_id
        )
        db.add(new_like)
        reply.like_count += 1
        db.commit()
        return {"message": "Reply liked", "liked": True}

# Combined endpoint for the main RFC page
@router.get("", response_model=schemas.RequestForCommentResponse)
def get_request_for_comment_page(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """Get all data for the Request for Comment page (features + user votes + comments)"""
    
    # Get features (reuse the logic from get_features)
    features = db.query(models.Feature).order_by(desc(models.Feature.vote_count)).all()
    user_votes = db.query(models.FeatureVote.feature_id).filter(
        models.FeatureVote.user_id == current_user.id
    ).all()
    user_voted_feature_ids = {vote[0] for vote in user_votes}
    
    feature_responses = []
    for feature in features:
        feature_dict = {
            "id": feature.id,
            "title": feature.title,
            "description": feature.description,
            "vote_count": feature.vote_count,
            "created_at": feature.created_at,
            "updated_at": feature.updated_at,
            "created_by": feature.created_by,
            "user_has_voted": feature.id in user_voted_feature_ids
        }
        feature_responses.append(schemas.FeatureResponse(**feature_dict))
    
    # Get user vote summary
    total_votes = len(user_votes)
    remaining_votes = max(0, 2 - total_votes)
    voted_features = [vote[0] for vote in user_votes]
    
    user_vote_summary = schemas.UserVoteSummary(
        total_votes=total_votes,
        remaining_votes=remaining_votes,
        voted_features=voted_features
    )
    
    # Get comments (simplified version - first 10 comments)
    comments = db.query(models.Comment).options(
        joinedload(models.Comment.author)
    ).order_by(desc(models.Comment.created_at)).limit(10).all()
    
    # Get user's likes for performance
    user_comment_likes = db.query(models.CommentLike.comment_id).filter(
        models.CommentLike.user_id == current_user.id
    ).all()
    user_liked_comment_ids = {like[0] for like in user_comment_likes}
    
    # Get user's reply likes
    user_reply_likes = db.query(models.CommentReplyLike.reply_id).filter(
        models.CommentReplyLike.user_id == current_user.id
    ).all()
    user_liked_reply_ids = {like[0] for like in user_reply_likes}

    comment_responses = []
    for comment in comments:
        # Get replies for this comment (include replies in main page)
        replies = db.query(models.CommentReply).options(
            joinedload(models.CommentReply.author)
        ).filter(
            models.CommentReply.comment_id == comment.id
        ).order_by(models.CommentReply.created_at).all()
        
        # Build reply responses
        reply_responses = []
        for reply in replies:
            reply_dict = {
                "id": reply.id,
                "content": reply.content,
                "comment_id": reply.comment_id,
                "author_id": reply.author_id,
                "like_count": reply.like_count,
                "created_at": reply.created_at,
                "updated_at": reply.updated_at,
                "author": {
                    "id": reply.author.id,
                    "username": reply.author.username,
                    "profile_picture": reply.author.profile_picture
                },
                "user_has_liked": reply.id in user_liked_reply_ids
            }
            reply_responses.append(schemas.CommentReplyResponse(**reply_dict))
        
        comment_dict = {
            "id": comment.id,
            "content": comment.content,
            "author_id": comment.author_id,
            "like_count": comment.like_count,
            "reply_count": comment.reply_count,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
            "author": {
                "id": comment.author.id,
                "username": comment.author.username,
                "profile_picture": comment.author.profile_picture
            },
            "user_has_liked": comment.id in user_liked_comment_ids,
            "replies": reply_responses  # Include replies in main page
        }
        comment_responses.append(schemas.CommentResponse(**comment_dict))
    
    return schemas.RequestForCommentResponse(
        features=feature_responses,
        user_vote_summary=user_vote_summary,
        comments=comment_responses
    )