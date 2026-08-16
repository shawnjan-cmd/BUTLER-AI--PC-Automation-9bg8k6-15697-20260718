export interface HealthFinding {
  id: string;
  title: string;
  status?: 'open' | 'fixed';
  description?: string;
  fixed?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  detail: string;
  autoFixable?: boolean;
}

type Subscriber = (findings: HealthFinding[]) => void;

class AppHealthEngine {
  subscribe(listener: Subscriber) {
    listener([]);
    return () => {};
  }

  async attemptFix(_id: string) {}
  async attemptFixAll() {}
  async runNow() {
    return [] as HealthFinding[];
  }
}

export const appHealthEngine = new AppHealthEngine();
