import { VisualPage } from '@/components/ui/VisualPage';

export default function FileShareScreen() {
  return (
    <VisualPage
      eyebrow="VAULT"
      title="File Hub"
      subtitle="Centralized sharing area for exports, script bundles, and generated assets."
      sections={[
        {
          title: 'Transfer Types',
          items: [
            { title: 'Script Exports', description: 'Package flows for reuse across environments.', cta: 'Ready' },
            { title: 'Session Reports', description: 'Share concise logs with stakeholders.', cta: 'Ready' },
            { title: 'Support Bundles', description: 'Collect critical diagnostics for debugging.', cta: 'Ready' },
          ],
        },
        {
          title: 'Connected Areas',
          items: [
            { title: 'Downloads', description: 'Review incoming assets and updates.', href: '/(tabs)/downloads' },
            { title: 'Builder', description: 'Export new outputs from your build pipeline.', href: '/(tabs)/builder' },
          ],
        },
      ]}
    />
  );
}
