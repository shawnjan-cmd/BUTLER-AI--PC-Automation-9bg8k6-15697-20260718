import { VisualPage } from '@/components/ui/VisualPage';

export default function ButlerScreen() {
  return (
    <VisualPage
      eyebrow="AI ASSISTANT"
      title="Butler Console"
      subtitle="Your assistant workspace is now focused, easier to scan, and ready for production polish."
      sections={[
        {
          title: 'Conversation Modes',
          items: [
            { title: 'Execution Copilot', description: 'Plan and execute daily tasks with concise guidance.', cta: 'Ready' },
            { title: 'Research Copilot', description: 'Summarize references and extract actionable insights.', cta: 'Ready' },
            { title: 'Support Copilot', description: 'Prepare user-facing replies with consistent tone.', cta: 'Ready' },
          ],
        },
        {
          title: 'Jump To',
          items: [
            { title: 'Knowledge', description: 'Reference documentation and saved notes.', href: '/(tabs)/knowledge' },
            { title: 'Connect', description: 'Verify backend and device communication.', href: '/(tabs)/connect', cta: 'Pair' },
          ],
        },
      ]}
    />
  );
}
