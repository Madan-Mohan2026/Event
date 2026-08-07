import React from 'react';
import type { Speaker } from '../../types/event';
import { LinkedinIcon, TwitterIcon } from '../common/SocialIcons';

interface SpeakerCardProps {
  speaker: Speaker;
}

export const SpeakerCard: React.FC<SpeakerCardProps> = ({ speaker }) => {
  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-start gap-4 group hover:border-indigo-500/40">
      <img
        src={speaker.avatarUrl}
        alt={speaker.name}
        className="w-16 h-16 rounded-2xl object-cover border border-slate-700/60 group-hover:scale-105 transition-transform duration-300 shrink-0"
      />
      
      <div className="space-y-1 flex-1 min-w-0">
        <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
          {speaker.name}
        </h4>
        <p className="text-xs text-indigo-400 font-medium truncate">
          {speaker.title}
        </p>
        <p className="text-xs text-slate-400 font-medium truncate">
          {speaker.organization}
        </p>

        {speaker.bio && (
          <p className="text-xs text-slate-400 pt-1 line-clamp-2 leading-relaxed">
            {speaker.bio}
          </p>
        )}

        <div className="pt-2 flex items-center gap-2">
          {speaker.linkedin && (
            <a
              href={speaker.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label={`${speaker.name} LinkedIn`}
              className="text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <LinkedinIcon className="w-3.5 h-3.5" />
            </a>
          )}
          {speaker.twitter && (
            <a
              href={speaker.twitter}
              target="_blank"
              rel="noreferrer"
              aria-label={`${speaker.name} Twitter`}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <TwitterIcon className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
