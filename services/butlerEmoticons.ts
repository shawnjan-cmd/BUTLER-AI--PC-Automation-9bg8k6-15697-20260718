/**
 * Butler AI - Custom Robot Butler Emoticons & Expressions
 * Styled to match the neon cyberpunk mascot and AI chat avatar.
 */

export const BUTLER_EMOTICONS = {
  neutral: "[🤖💬]",
  thinking: "[🤖💭⚡]",
  secure: "[🤖🛡️🔒]",
  success: "[🤖✨👍]",
  warning: "[🤖⚠️⚡]",
  error: "[🤖❌🚨]",
  crawling: "[🤖🕷️🌐]",
  mood_happy: "[🤖😊✨]",
  mood_focused: "[🤖🎯🔥]",
  mood_vigilant: "[🤖👁️⚡]"
};

export function getButlerEmoticon(mood: string): string {
  return (BUTLER_EMOTICONS as Record<string, string>)[mood] || BUTLER_EMOTICONS.neutral;
}
