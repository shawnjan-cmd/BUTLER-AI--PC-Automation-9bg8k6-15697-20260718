import { VisualPage } from '@/components/ui/VisualPage';

export default function BuilderScreen() {
  return (
    <VisualPage
      eyebrow="WORKSHOP"
      title="Builder Studio"
      subtitle="Create polished automation blocks and combine them into repeatable production flows."
      sections={[
        {
          title: 'Build Blocks',
          items: [
            { title: 'Task Node', description: 'Define one executable unit with clear inputs.', cta: 'Draft' },
            { title: 'Logic Branch', description: 'Control pathing for success and fallback states.', cta: 'Draft' },
            { title: 'Output Formatter', description: 'Standardize generated messages and reports.', cta: 'Draft' },
          ],
        },
        {
          title: 'Publish Path',
          items: [
            { title: 'Scripts Forge', description: 'Ship built flows to script templates.', href: '/(tabs)/scripts' },
            { title: 'Files Vault', description: 'Export generated artifacts for sharing.', href: '/(tabs)/fileshare' },
          ],
        },
      ]}
    />
  );
}
