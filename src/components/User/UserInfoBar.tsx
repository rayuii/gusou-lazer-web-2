import React from 'react';
import { type User } from '../../types';
import { Tooltip } from 'react-tooltip';
import { FaTwitter, FaGlobe, FaDiscord, FaHeart, FaMapMarkerAlt, FaBriefcase } from 'react-icons/fa';

interface UserInfoBarProps {
  user: User;
}

const PLAYSTYLE_LABELS: Record<string, string> = {
  mouse: 'Mouse',
  keyboard: 'Keyboard',
  tablet: 'Tablet',
  touch: 'Touch',
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatLastSeen = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 5) return 'online now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return formatDate(dateStr);
};

const UserInfoBar: React.FC<UserInfoBarProps> = ({ user }) => {
  const playstyleLabel = user.playstyle && user.playstyle.length > 0
    ? user.playstyle.map(s => PLAYSTYLE_LABELS[s] ?? s).join(', ')
    : null;

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: joined, last seen, plays with, post count, comment count */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
        {user.join_date && (
          <span>
            Joined <span className="font-semibold text-gray-700 dark:text-gray-200">{formatDate(user.join_date)}</span>
          </span>
        )}
        {user.last_visit && (
          <span>
            Last seen <span className="font-semibold text-gray-700 dark:text-gray-200">{formatLastSeen(user.last_visit)}</span>
          </span>
        )}
        {playstyleLabel && (
          <span>
            Plays with <span className="font-semibold text-gray-700 dark:text-gray-200">{playstyleLabel}</span>
          </span>
        )}
        {user.post_count > 0 && (
          <span>
            Contributed <span className="font-semibold text-gray-700 dark:text-gray-200">{user.post_count.toLocaleString()} forum post{user.post_count !== 1 ? 's' : ''}</span>
          </span>
        )}
        {user.comments_count > 0 && (
          <span>
            Posted <span className="font-semibold text-gray-700 dark:text-gray-200">{user.comments_count.toLocaleString()} comment{user.comments_count !== 1 ? 's' : ''}</span>
          </span>
        )}
      </div>

      {/* Row 2: interests, location, occupation, twitter, website, discord */}
      {(user.interests || user.location || user.occupation || user.twitter || user.website || user.discord) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {user.interests && (
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <FaHeart className="text-osu-pink text-xs flex-shrink-0" />
              <span>{user.interests}</span>
            </span>
          )}
          {user.location && (
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <FaMapMarkerAlt className="text-xs flex-shrink-0" />
              <span>{user.location}</span>
            </span>
          )}
          {user.occupation && (
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <FaBriefcase className="text-xs flex-shrink-0" />
              <span>{user.occupation}</span>
            </span>
          )}
          {user.twitter && (
            <a
              href={`https://twitter.com/${user.twitter.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sky-500 hover:text-sky-400 transition-colors"
            >
              <FaTwitter className="text-xs flex-shrink-0" />
              <span>{user.twitter.startsWith('@') ? user.twitter : `@${user.twitter}`}</span>
            </a>
          )}
          {user.website && (
            <a
              href={user.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:text-blue-400 transition-colors"
            >
              <FaGlobe className="text-xs flex-shrink-0" />
              <span>{user.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          {user.discord && (
            <span
              className="flex items-center gap-1 text-indigo-400 cursor-pointer"
              data-tooltip-id="discord-tooltip"
              data-tooltip-content={user.discord}
              onClick={() => navigator.clipboard?.writeText(user.discord!)}
            >
              <FaDiscord className="text-xs flex-shrink-0" />
              <span>{user.discord}</span>
              <Tooltip id="discord-tooltip" content="Click to copy" />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserInfoBar;