import re

def update_probe_panel():
    with open('ultimate-sd/src/components/ProbePanel.tsx', 'r') as f:
        content = f.read()

    if "import { fetchWithRetry, getUserFacingFetchError } from '@/lib/fetchUtils';" not in content:
        content = content.replace("import type { ChatMessage, SystemDesignProblem } from '@/types';", "import type { ChatMessage, SystemDesignProblem } from '@/types';\nimport { fetchWithRetry, getUserFacingFetchError } from '@/lib/fetchUtils';")

    old_fetch = r"""      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'probe',
          slug: problem.slug,
          phase,
          stepAnswer,
          probeMessages: history,
          round: nextRound,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Probe unavailable.');
        return;
      }"""

    new_fetch = r"""      const res = await fetchWithRetry('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'probe',
          slug: problem.slug,
          phase,
          stepAnswer,
          probeMessages: history,
          round: nextRound,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }"""

    content = content.replace(old_fetch, new_fetch)
    content = content.replace("    } catch {\n      setError('Probe unavailable.');", "    } catch (e) {\n      setError(getUserFacingFetchError(e) || 'Probe unavailable.');")

    with open('ultimate-sd/src/components/ProbePanel.tsx', 'w') as f:
        f.write(content)

def update_interview_summary():
    with open('ultimate-sd/src/components/InterviewSummaryPanel.tsx', 'r') as f:
        content = f.read()

    if "import { fetchWithRetry, getUserFacingFetchError } from '@/lib/fetchUtils';" not in content:
        content = content.replace("import { toast } from 'sonner';", "import { toast } from 'sonner';\nimport { fetchWithRetry, getUserFacingFetchError } from '@/lib/fetchUtils';")

    old_fetch_summary = r"""        const res = await fetch('/api/interview/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: problem.slug, answers, variant: interviewVariant }),
        });
        const data = await res.json();
        if (!res.ok || !data.summary) {
          setError(data.error ?? 'Could not generate your debrief.');
          onSummaryFailed();
          return;
        }"""

    new_fetch_summary = r"""        const res = await fetchWithRetry('/api/interview/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: problem.slug, answers, variant: interviewVariant }),
        });
        const data = await res.json();
        if (data.error || !data.summary) {
          setError(data.error ?? 'Could not generate your debrief.');
          onSummaryFailed();
          return;
        }"""

    content = content.replace(old_fetch_summary, new_fetch_summary)
    content = content.replace("      } catch {\n        setError('Could not generate your debrief.');", "      } catch (e) {\n        setError(getUserFacingFetchError(e) || 'Could not generate your debrief.');")

    old_fetch_share = r"""      const res = await fetch('/api/interview/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debriefId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data.error ?? 'Could not create share link.');
        return;
      }"""

    new_fetch_share = r"""      const res = await fetchWithRetry('/api/interview/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debriefId }),
      });
      const data = await res.json();
      if (data.error || !data.url) {
        toast.error(data.error ?? 'Could not create share link.');
        return;
      }"""

    content = content.replace(old_fetch_share, new_fetch_share)
    content = content.replace("    } catch {\n      toast.error('Could not create share link.');", "    } catch (e) {\n      toast.error(getUserFacingFetchError(e) || 'Could not create share link.');")

    with open('ultimate-sd/src/components/InterviewSummaryPanel.tsx', 'w') as f:
        f.write(content)

def update_voice_panel():
    with open('ultimate-sd/src/components/voice/VoicePanel.tsx', 'r') as f:
        content = f.read()

    if "import { fetchWithRetry, getUserFacingFetchError } from '@/lib/fetchUtils';" not in content:
        content = content.replace("import { Button } from '@/components/ui/button';", "import { Button } from '@/components/ui/button';\nimport { fetchWithRetry, getUserFacingFetchError } from '@/lib/fetchUtils';")

    old_fetch_speak = r"""        const res = await fetch('/api/voice/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentSessionId, text }),
        });
        if (!res.ok) {"""

    new_fetch_speak = r"""        const res = await fetchWithRetry('/api/voice/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentSessionId, text }),
        });
        const data = await res.clone().json().catch(() => ({}));
        if (data.error) {"""

    content = content.replace(old_fetch_speak, new_fetch_speak)

    old_fetch_session = r"""      const res = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, practiceSessionId }),
      });
      const body = await res.json();
      if (!res.ok) {
        fail(body.error ?? 'Could not start the voice session.');
        return;
      }"""

    new_fetch_session = r"""      const res = await fetchWithRetry('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, practiceSessionId }),
      });
      const body = await res.json();
      if (body.error) {
        fail(body.error);
        return;
      }"""

    content = content.replace(old_fetch_session, new_fetch_session)
    content = content.replace("    } catch {\n      fail('Could not start the voice session.');", "    } catch (e) {\n      fail(getUserFacingFetchError(e) || 'Could not start the voice session.');")

    old_fetch_transcribe = r"""          const sttRes = await fetch('/api/voice/transcribe', { method: 'POST', body: form });
          const sttBody = await sttRes.json();
          if (!sttRes.ok) {
            fail(sttBody.error ?? 'Transcription failed.');
            return;
          }"""

    new_fetch_transcribe = r"""          const sttRes = await fetchWithRetry('/api/voice/transcribe', { method: 'POST', body: form });
          const sttBody = await sttRes.json();
          if (sttBody.error) {
            fail(sttBody.error);
            return;
          }"""

    content = content.replace(old_fetch_transcribe, new_fetch_transcribe)

    old_fetch_reply = r"""          const replyRes = await fetch('/api/voice/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, transcript: sttBody.transcript }),
          });
          const replyBody = await replyRes.json();
          if (!replyRes.ok) {
            fail(replyBody.error ?? 'The interviewer did not respond.');
            return;
          }"""

    new_fetch_reply = r"""          const replyRes = await fetchWithRetry('/api/voice/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, transcript: sttBody.transcript }),
          });
          const replyBody = await replyRes.json();
          if (replyBody.error) {
            fail(replyBody.error);
            return;
          }"""

    content = content.replace(old_fetch_reply, new_fetch_reply)
    content = content.replace("        } catch {\n          fail('Network error during the voice turn.');", "        } catch (e) {\n          fail(getUserFacingFetchError(e) || 'Network error during the voice turn.');")

    with open('ultimate-sd/src/components/voice/VoicePanel.tsx', 'w') as f:
        f.write(content)

try:
    update_probe_panel()
    update_interview_summary()
    update_voice_panel()
except Exception as e:
    print(e)
