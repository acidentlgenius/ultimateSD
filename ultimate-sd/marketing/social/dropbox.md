# Dropbox guide — social pack

## LinkedIn caption

A user edits one line of a 2 GB file. How much does Dropbox upload?

Almost everyone I've mock-interviewed answers this wrong. They say "store the files in S3" and think they're done. But the round isn't lost on storage — it's lost on sync.

Swipe through for the 3 follow-ups that actually decide this interview:

1. Edit 1 line of a 2 GB file — what uploads? (chunking, content hashes, delta sync)
2. Two devices edit the same file offline — who wins? (why last-writer-wins destroys work, and what Dropbox does instead)
3. How do other devices find out about changes? (notification service, long polling vs WebSocket)

I wrote the full guide, free, with an interactive chunking demo embedded — you can edit a file and watch which chunks re-upload:
ultimate-sd.vercel.app/guides/design-dropbox

Then practice it out loud against an interviewer that pushes back, with a live diagram:
ultimate-sd.vercel.app/practice/design-dropbox

Launch offer — 50 slots, ends July 15: 3 months of Platform free.

#systemdesign #interviewprep #softwareengineering

## X thread

1/ Edit one line of a 2GB file — how much does Dropbox upload?

Almost everyone answers this wrong in interviews. The round isn't lost on "store files in S3." It's lost on sync.

[attach GIF/carousel images]

2/ The answer: files are split into ~4MB chunks, each identified by its SHA-256 content hash.

After an edit, unchanged chunks hash the same. Only the changed chunks leave the device. That's delta sync — a few MB, not 2GB.

3/ The same mechanism pays twice. Chunks are content-addressed, so if any user anywhere already uploaded a chunk, it's never stored again.

At 500 PB raw, a 30% dedupe ratio is 150 PB saved. Dedupe isn't an optimization — it's the business model.

4/ Follow-up that breaks people: two devices edit the same file offline, then reconnect. Who wins?

Last-writer-wins silently deletes someone's work. Dropbox keeps both — the loser becomes "budget (conflicted copy — Bob's MacBook).xlsx" and a human resolves it.

5/ Last piece: how do other devices find out? A notification service pushes a tiny "file X is now version 7" over long polling — 10M devices polling every 5s would be 2M QPS of nothing.

The device fetches the new chunk list and pulls only the chunks it lacks.

6/ Full Dropbox guide is free — requirements, capacity math, chunking, conflicts, architecture. There's an interactive chunking demo embedded: edit a file, watch which chunks re-upload.

ultimate-sd.vercel.app/guides/design-dropbox

## Media

Run `node scripts/generate-linkedin-media.mjs dropbox` — outputs PNGs to marketing/linkedin/output/dropbox/.
