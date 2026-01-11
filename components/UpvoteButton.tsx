'use client';

import { useState, useEffect } from 'react';
import { db, id } from '@/lib/db';

interface UpvoteButtonProps {
  memeId: string;
}

export default function UpvoteButton({ memeId }: UpvoteButtonProps) {
  const { user } = db.useAuth();
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Fetch votes for this meme using links - query from meme side
  const { data, error } = db.useQuery({
    memes: {
      $: {
        where: { id: memeId },
      },
      votes: {
        user: {},
      },
    },
  });

  useEffect(() => {
    if (error) {
      console.error('VoteButton query error:', error);
    }
  }, [error]);

  useEffect(() => {
    const meme = data?.memes?.[0];
    if (meme?.votes) {
      setVoteCount(meme.votes.length);
      if (user) {
        const userVote = meme.votes.find((vote: any) => vote.user?.id === user.id);
        setHasVoted(!!userVote);
      } else {
        setHasVoted(false);
      }
    } else {
      setVoteCount(0);
      setHasVoted(false);
    }
  }, [data, user, memeId]);

  const handleVote = async () => {
    if (!user) {
      alert('Please sign in to vote on memes!');
      return;
    }

    setIsToggling(true);

    try {
      if (hasVoted) {
        // Remove vote - find the vote and delete it
        const meme = data?.memes?.[0];
        const userVote = meme?.votes?.find((vote: any) => vote.user?.id === user.id);
        if (userVote) {
          await db.transact(db.tx.votes[userVote.id].delete());
        }
      } else {
        // Add vote with links
        // voteMeme link has label 'meme', voteUser link has label 'user'
        const voteId = id();
        await db.transact(
          db.tx.votes[voteId].update({
            createdAt: Date.now(),
            meme: memeId,
            user: user.id,
          })
        );
      }
    } catch (error) {
      console.error('Error toggling vote:', error);
      alert('Failed to update vote. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      className={`upvote-button ${hasVoted ? 'upvoted' : ''}`}
      onClick={handleVote}
      disabled={isToggling}
    >
      <span>👍</span>
      <span className="upvote-count">{voteCount}</span>
    </button>
  );
}
