import { calculateSessionVolume } from './gameLogic';
import { parseDecimalInput } from './numberUtils';
import { isOverloadStatus } from './overloadModel';

export const VOLUME_XP_RATE = 0.05;
export const OVERLOAD_XP_MULTIPLIER = 1.2;

export const calculateSessionXp = (session = {}) => {
  const persistedXp = parseDecimalInput(session.earnedXp ?? session.earned_xp);
  if (persistedXp !== null) return Math.max(0, Math.floor(persistedXp));

  const storedVolume = parseDecimalInput(session.totalVolume ?? session.total_volume);
  const volume = storedVolume ?? calculateSessionVolume(session);
  const bonusXp = parseDecimalInput(session.bonusXp ?? session.bonus_xp) ?? 0;
  const multiplier = isOverloadStatus(session.overloadStatus ?? session.overload_status)
    ? OVERLOAD_XP_MULTIPLIER
    : 1;

  return Math.max(0, Math.floor(volume * VOLUME_XP_RATE * multiplier) + bonusXp);
};
