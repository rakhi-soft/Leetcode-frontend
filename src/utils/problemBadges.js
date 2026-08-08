export const getDifficultyBadgeClass = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'badge-success text-success-content border-0';
    case 'medium':
      return 'badge-warning text-warning-content border-0';
    case 'hard':
      return 'badge-error text-error-content border-0';
    default:
      return 'badge-neutral';
  }
};

export const getTagBadgeClass = () => 'badge-info text-info-content border-0';

export const getSolvedBadgeClass = () => 'badge-success text-success-content border-0';
