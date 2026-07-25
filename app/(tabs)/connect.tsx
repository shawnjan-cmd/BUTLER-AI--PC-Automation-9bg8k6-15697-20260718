import { VisualPage } from '@/components/ui/VisualPage';

export default function ConnectScreen() {
  return (
    <VisualPage
      eyebrow="PAIRING"
      title="Connect Workspace"
      subtitle="Professional connection screen for linking Butler AI to your PC ecosystem."
      sections={[
        {
          title: 'Connection Setup',
          items: [
            { title: 'Primary Endpoint', description: 'Set host, port, and secure route for your main machine.', cta: 'Configure' },
            { title: 'Auth Token', description: 'Use token-based authentication for trusted access.', cta: 'Secure' },
            { title: 'Health Check', description: 'Run connectivity verification before launching automations.', cta: 'Verify' },
          ],
        },
        {
          title: 'Compliance',
          items: [
            { title: 'Data Safety', description: 'Review disclosure notes used for Play Store readiness.', href: '/data-safety', cta: 'Review' },
            { title: 'Security & Trust', description: 'Read core security posture and hardening notes.', href: '/security-trust', cta: 'Review' },
          ],
        },
      ]}
    />
  );
}
