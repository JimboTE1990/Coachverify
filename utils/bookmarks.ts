const STORAGE_KEY = 'coachdog_bookmarks';

export const getBookmarkedIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

export const isBookmarked = (coachId: string): boolean =>
  getBookmarkedIds().includes(coachId);

export const addBookmark = (coachId: string): void => {
  const ids = getBookmarkedIds();
  if (!ids.includes(coachId)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, coachId]));
  }
};

export const removeBookmark = (coachId: string): void => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(getBookmarkedIds().filter(id => id !== coachId))
  );
};

export const clearBookmarks = (): void =>
  localStorage.removeItem(STORAGE_KEY);
