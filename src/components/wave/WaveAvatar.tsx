
import { cn } from '@/lib/utils';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-amber-500',
];

export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

interface WaveAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  status?: UserStatus;
  /** @deprecated use status instead */
  online?: boolean;
  image?: string;
  className?: string;
}

const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
const dotMap = { sm: 'w-2.5 h-2.5', md: 'w-3 h-3', lg: 'w-3.5 h-3.5' };

const statusColorMap: Record<UserStatus, string> = {
  online: 'bg-wave-online',
  away: 'bg-wave-away',
  busy: 'bg-wave-busy',
  offline: 'bg-wave-offline',
};

const WaveAvatar = ({ name, size = 'md', status, online, image, className }: WaveAvatarProps) => {
  // Backwards compatibility: if status not provided, use online boolean
  const resolvedStatus: UserStatus | undefined = status ?? (online !== undefined ? (online ? 'online' : 'offline') : undefined);

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {image ? (
        <img src={image} alt={name} className={cn('rounded-full object-cover', sizeMap[size], 'shadow-md', 'transition-all', 'hover:opacity-90')} />
      ) : (
        <div className={cn('rounded-full flex items-center justify-center font-semibold text-primary-foreground', sizeMap[size], getColor(name))}>
          {getInitials(name)}
        </div>
      )}
      {resolvedStatus !== undefined && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-card',
          dotMap[size],
          statusColorMap[resolvedStatus]
        )} />
      )}
    </div>
  );
};

export default WaveAvatar;
