import { VisualPage } from '@/components/ui/VisualPage';

export default function NexusHomeScreen() {
  return (
    <VisualPage
      eyebrow="BUTLER AI"
      title="Command Center"
      subtitle="A rebuilt professional shell focused on speed, clarity, and reliable startup behavior."
      sections={[
        {
          title: 'Quick Access',
          items: [
            { title: 'Open Butler', description: 'Jump into AI assistant workflows.', href: '/(tabs)/butler', cta: 'Launch' },
            { title: 'Connect Devices', description: 'Set up trusted links to your PC and tools.', href: '/(tabs)/connect', cta: 'Pair' },
            { title: 'System Settings', description: 'Adjust app controls and legal preferences.', href: '/(tabs)/settings', cta: 'Manage' },
          ],
        },
        {
          title: 'Workspace Modules',
          items: [
            { title: 'Automation Scripts', description: 'Run or prepare reusable script flows.', href: '/(tabs)/scripts' },
            { title: 'Knowledge Vault', description: 'Organize notes, SOPs, and references.', href: '/(tabs)/knowledge' },
            { title: 'Operations Logs', description: 'Track app events, actions, and outcomes.', href: '/(tabs)/logs' },
          ],
        },
      ]}
      footerNote="Butler AI Visual Reset · Stable Navigation Edition"
    />
  );
}
