// src/utils/questRules.js

export const QUEST_RULES = {
  'heavy_lifter': (sessionData) => sessionData.totalVolume >= 10000,
  'volume_2000': (sessionData) => sessionData.totalVolume >= 2000,
  'perfect_focus': (sessionData) => sessionData.totalSets > 0 && sessionData.completedSets === sessionData.totalSets,
  'speedrun': (sessionData) => sessionData.duration > 0 && sessionData.duration < 3600 && sessionData.finished,
  'time_45': (sessionData) => sessionData.duration >= 2700,
  'note': (sessionData) => sessionData.hasNote === true,
  'swap': (sessionData) => sessionData.exercisesSwapped > 0,
  'pr': (sessionData) => sessionData.prsBroken > 0
};