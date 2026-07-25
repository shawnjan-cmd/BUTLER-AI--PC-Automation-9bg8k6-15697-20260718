import { VisualPage } from '@/components/ui/VisualPage';

export default function ScriptsScreen() {
  return (
    <VisualPage
      eyebrow="AUTOMATION"
      title="Scripts Forge"
      subtitle="Build, organize, and launch repeatable automations with a cleaner production-ready UI."
      sections={[
        {
          title: 'Starter Packs',
          items: [
            { title: 'Launch Sequence', description: 'Open your daily work stack in one action.', cta: 'Template' },
            { title: 'Cleanup Routine', description: 'Close tabs, clear temp files, and prep handoff.', cta: 'Template' },
            { title: 'Report Snapshot', description: 'Collect quick metrics for status updates.', cta: 'Template' },
          ],
        },
        {
          title: 'Related Areas',
          items: [
            { title: 'Builder', description: 'Design script bundles and future recipes.', href: '/(tabs)/builder', cta: 'Open' },
            { title: 'Logs', description: 'Review run history and execution health.', href: '/(tabs)/logs', cta: 'Review' },
          ],
        },
      ]}
    />
  );
}
