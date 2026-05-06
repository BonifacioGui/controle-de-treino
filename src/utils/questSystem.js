// src/utils/questSystem.js
import { QUEST_RULES } from './questRules';

const QUEST_POOL = [
  { id: 'q1', title: 'Sobrecarga Crítica', desc: 'Bata 1 Novo PR no treino de hoje', reward: 150, type: 'pr', completed: false },
  { id: 'q2', title: 'Resistência Biológica', desc: 'Treine por mais de 45 minutos', reward: 80, type: 'time_45', completed: false },
  { id: 'q3', title: 'Relatório Tático', desc: 'Escreva uma anotação no final do treino', reward: 40, type: 'note', completed: false },
  { id: 'q4', title: 'Adaptação', desc: 'Use o botão de trocar exercício', reward: 30, type: 'swap', completed: false },
  { id: 'q5', title: 'Força Bruta', desc: 'Levante mais de 2.000kg totais', reward: 100, type: 'volume_2000', completed: false }
];

export const generateDailyQuests = () => {
  const today = new Date().toISOString().split('T')[0];
  const savedData = JSON.parse(localStorage.getItem('daily_quests_data') || '{}');

  if (savedData.date !== today) {
    const shuffled = QUEST_POOL.sort(() => 0.5 - Math.random());
    const dailyQuests = shuffled.slice(0, 2);

    const newData = {
      date: today,
      quests: dailyQuests
    };

    localStorage.setItem('daily_quests_data', JSON.stringify(newData));
    localStorage.setItem('daily_quests', JSON.stringify(dailyQuests));
    window.dispatchEvent(new Event('quest_update'));
  }
};

export const validateWorkoutQuests = (sessionData) => {
  const dailyQuests = JSON.parse(localStorage.getItem('daily_quests') || '[]');
  let questsUpdated = false;

  const updatedQuests = dailyQuests.map(quest => {
    if (quest.completed) return quest;

    const checkRule = QUEST_RULES[quest.type];
    
    if (checkRule && checkRule(sessionData) === true) {
      questsUpdated = true;
      return { ...quest, completed: true };
    }
    return quest;
  });

  if (questsUpdated) {
    localStorage.setItem('daily_quests', JSON.stringify(updatedQuests));
    window.dispatchEvent(new Event('quest_update'));
  }
};