import { VisualPage } from '@/components/ui/VisualPage';

export default function KnowledgeScreen() {
  return (
    <VisualPage
      eyebrow="KNOWLEDGE"
      title="Knowledge Vault"
      subtitle="Structured place for SOPs, playbooks, and reusable team context."
      sections={[
        {
          title: 'Collections',
          items: [
            { title: 'Playbooks', description: 'Step-by-step flows for recurring operations.', cta: 'Browse' },
            { title: 'Troubleshooting', description: 'Known issues and verified fix paths.', cta: 'Browse' },
            { title: 'Release Notes', description: 'Track updates and production decisions.', cta: 'Browse' },
          ],
        },
        {
          title: 'Quick Actions',
          items: [
            { title: 'Open Logs', description: 'Correlate guidance with real usage events.', href: '/(tabs)/logs' },
            { title: 'Open Butler', description: 'Ask Butler to draft or refine docs.', href: '/(tabs)/butler' },
          ],
        },
      ]}
    />
  );
}
