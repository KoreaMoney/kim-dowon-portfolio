export type GuideIntroSession = {
  explicitlyEngaged: boolean;
  dismissed: boolean;
};

export function shouldShowGuideIntro(session: GuideIntroSession) {
  return !session.explicitlyEngaged && !session.dismissed;
}

export function nextGuideIntroIndex(current: number, total: number) {
  if (total <= 0 || current >= total - 1) return null;
  return current + 1;
}
