import { VisualPage } from '@/components/ui/VisualPage';

export default function SettingsScreen() {
  return (
    <VisualPage
      eyebrow="CONTROL"
      title="Settings"
      subtitle="Centralized controls for app behavior, privacy policies, and personalization."
      sections={[
        {
          title: 'App Controls',
          items: [
            { title: 'Experience Profile', description: 'Switch between focused, balanced, or power workflows.', cta: 'Adjust' },
            { title: 'Notifications', description: 'Tune alerts for automation events and updates.', cta: 'Adjust' },
            { title: 'Session Recovery', description: 'Keep startup resilient with safe defaults.', cta: 'Enabled' },
          ],
        },
        {
          title: 'Legal & Trust',
          items: [
            { title: 'Privacy Policy', description: 'Review data handling commitments.', href: '/privacy-policy', cta: 'Open' },
            { title: 'Terms of Service', description: 'Review usage terms and limitations.', href: '/terms', cta: 'Open' },
            { title: 'Data Safety', description: 'Review Play Store disclosure summary.', href: '/data-safety', cta: 'Open' },
          ],
        },
      ]}
    />
  );
}
