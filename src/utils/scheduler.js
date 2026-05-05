/**
 * Time Management Algorithm for Group Discussion Flow
 *
 * Gap Rules:
 * - Beginning (steps 1-5):  45 seconds to 1 minute
 * - Middle   (steps 6-15): 1 minute to 1.5 minutes
 * - End      (steps 16+):  1.5 minutes to 2 minutes
 *
 * The algorithm ensures:
 * - No two participants message at the same time
 * - Natural conversation flow with increasing gaps
 * - Reply/thread references where applicable
 */

export function calculateDelay(stepNumber, totalSteps) {
  const ratio = stepNumber / totalSteps;
  if (ratio <= 0.25) {
    return 45 + Math.floor(Math.random() * 16);
  } else if (ratio <= 0.75) {
    return 60 + Math.floor(Math.random() * 31);
  } else {
    return 90 + Math.floor(Math.random() * 31);
  }
}

export function generateSchedule(steps, startTime = '08:00:00') {
  const [h, m, s] = startTime.split(':').map(Number);
  let currentSeconds = h * 3600 + m * 60 + s;

  return steps.map((step, index) => {
    if (index === 0) {
      return { ...step, scheduled_time: formatTime(currentSeconds), delay_seconds: 0 };
    }
    const delay = calculateDelay(index + 1, steps.length);
    currentSeconds += delay;
    return { ...step, scheduled_time: formatTime(currentSeconds), delay_seconds: delay };
  });
}

export function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function parseTime(timeStr) {
  if (!timeStr) return 0;
  const [h, m, s] = timeStr.split(':').map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

export const MESSAGE_TYPES = [
  { value: 'opening_topic', label: 'Opening Topic', color: '#0088cc' },
  { value: 'question', label: 'Question', color: '#e09255' },
  { value: 'answer', label: 'Answer', color: '#4fae4e' },
  { value: 'agree', label: 'Agree', color: '#64b5ef' },
  { value: 'disagree', label: 'Disagree', color: '#e05555' },
  { value: 'example', label: 'Example', color: '#9c27b0' },
  { value: 'counter_reply', label: 'Counter Reply', color: '#ff5722' },
  { value: 'final_question', label: 'Final Question', color: '#ff9800' },
  { value: 'final_summary', label: 'Final Summary', color: '#2196f3' },
];

export function getMessageTypeInfo(type) {
  return MESSAGE_TYPES.find((t) => t.value === type) || { value: type, label: type, color: '#6d8296' };
}
