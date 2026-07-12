import { PracticePageShell } from '@/components/PracticePageShell';
import { SessionProvider } from '@/components/SessionProvider';

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PracticePageShell>{children}</PracticePageShell>
    </SessionProvider>
  );
}
