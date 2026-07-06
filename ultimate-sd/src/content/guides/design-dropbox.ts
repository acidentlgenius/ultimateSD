import { Guide } from '@/lib/guides';

export const dropboxGuide: Guide = {
  metadata: {
    slug: 'design-dropbox',
    problemSlug: 'design-dropbox',
    title: 'Design Dropbox / Google Drive (File Storage & Sync)',
    seoTitle: 'Design Dropbox — System Design Interview Guide',
    description:
      'Step-by-step guide to the Dropbox / Google Drive system design interview question: requirements, capacity estimation, chunking and deduplication, delta sync, metadata schema, conflict handling, and blob storage at scale. Includes an interactive chunking demo.',
    publishedAt: '2026-07-04',
    updatedAt: '2026-07-04',
    readingTime: '16 min read',
    keywords: [
      'design dropbox system design',
      'google drive system design',
      'file sync system design interview',
      'chunking and deduplication',
      'delta sync',
      'system design interview',
    ],
  },
  sections: [
    {
      id: 'why-this-question',
      title: 'Why interviewers ask this question',
      blocks: [
        {
          id: 'why-1',
          type: 'markdown',
          content:
            'Dropbox looks like "upload files, download files" — a glorified FTP server. That framing fails the interview. The real problem is **sync**: a user edits a 2 GB video on their laptop, and thirty seconds later the updated file is on their desktop, their phone, and their teammate\'s machine — without re-uploading 2 GB. That gap between the naive design and the real one is exactly what interviewers are probing.\n\nThis question tests three things at once: **large binary data handling** (you cannot stuff files in a database), **bandwidth-efficient protocols** (chunking, hashing, delta sync), and **multi-device consistency** (what happens when two devices edit the same file offline?). Junior candidates are expected to separate metadata from blob storage; senior candidates are expected to design the chunking pipeline and defend a conflict-resolution strategy.',
        },
        {
          id: 'why-callout',
          type: 'callout',
          variant: 'tip',
          title: 'The 30-second answer',
          content:
            'Split every file into ~4 MB chunks, hash each chunk with SHA-256, and upload only the chunks the server has never seen — straight to blob storage like S3. A metadata database maps files to ordered chunk lists and tracks versions. When a file changes, only the changed chunks upload (delta sync), and a notification service tells the user\'s other devices to pull the new version. Everything else in the interview is justifying those choices.',
        },
      ],
    },
    {
      id: 'requirements',
      title: 'Step 1 — Requirements',
      blocks: [
        {
          id: 'req-1',
          type: 'markdown',
          content:
            '**Functional requirements**\n\n- Upload and download files from any device.\n- **Automatic sync**: a change on one device propagates to all of the user\'s devices.\n- **Offline edits**: users can modify files without connectivity; changes sync on reconnect.\n- **File versioning**: restore a previous version of a file.\n- (Clarify) Sharing files/folders with other users — call it out, then de-scope it.\n- (Clarify) Max file size — assume up to a few GB; it justifies chunking.\n\n**Non-functional requirements**\n\n- **Durability above all.** Losing a user\'s only copy of their thesis is an extinction-level event for this product. Aim for eleven nines.\n- **Eventual consistency across devices** is acceptable — a few seconds of sync lag is fine; losing an edit is not.\n- **Bandwidth efficiency.** Users edit large files constantly; re-uploading whole files would destroy mobile data plans and your egress bill.\n- High availability for the sync path; reads and writes are roughly balanced (unlike TinyURL, this is not read-dominated).',
        },
        {
          id: 'req-note',
          type: 'interviewNote',
          title: 'Lead with durability',
          content:
            'The sentence that frames this whole interview: "Durability is the top priority — this system holds the only copy of people\'s data — so blob storage with redundancy is non-negotiable, and I\'ll trade sync latency for never losing a write." It tells the interviewer you understand what this product actually promises.',
        },
      ],
    },
    {
      id: 'capacity',
      title: 'Step 2 — Capacity estimation',
      blocks: [
        {
          id: 'cap-1',
          type: 'markdown',
          content:
            'Assume a mid-size Dropbox:\n\n- **Users:** 50M registered, 10M daily active.\n- **Storage:** 50M users × 10 GB average = **500 PB raw**. This single number reshapes the design — you are not building a database, you are building on top of an object store.\n- **Deduplication saves real money:** identical chunks (shared files, common installers, re-uploads, small edits to big files) mean typical dedupe ratios of 25–50%. At 500 PB, a 30% saving is **150 PB** — tens of millions of dollars a year. Dedupe is not an optimization; it is the business model.\n- **Upload traffic:** 10M DAU × 2 file edits/day ≈ 20M uploads/day ≈ **~230 uploads/sec** (peak ~1,000/sec). With delta sync, each "upload" averages a few chunks, not a whole file.\n- **Metadata:** 50M users × ~1,000 files × ~1 KB of metadata ≈ **~50 TB** — big, but a sharded relational database handles it. Metadata QPS (sync checks, listing folders) dwarfs file traffic: budget ~10× the upload rate.',
        },
        {
          id: 'cap-callout',
          type: 'callout',
          variant: 'info',
          title: 'The estimate that matters most',
          content:
            'The 500 PB figure is the headline. It immediately splits the architecture in two: petabytes of immutable chunks go to blob storage (S3), and terabytes of hot, queryable metadata go to a database. Candidates who compute this number and draw that line in the first ten minutes are already ahead.',
        },
        {
          id: 'cap-widget',
          type: 'widget',
          widgetId: 'capacity-calculator',
          title: 'Capacity calculator',
          caption:
            'Plug in your own assumptions (users, average storage per user, uploads per day) and watch storage and QPS estimates update live.',
        },
      ],
    },
    {
      id: 'api',
      title: 'Step 3 — API and metadata schema',
      blocks: [
        {
          id: 'api-1',
          type: 'markdown',
          content:
            'The upload flow is a two-phase conversation: the client tells the server which chunk hashes it has, the server replies with which ones it is missing, and the client uploads only those. That negotiation is the API\'s whole personality.',
        },
        {
          id: 'api-upload',
          type: 'code',
          language: 'http',
          filename: 'Chunk-based upload API',
          code: `POST /api/v1/files/{fileId}/commit
{
  "name": "thesis.docx",
  "parentFolderId": "f_8821",
  "size": 12582912,
  "chunks": [
    { "order": 0, "hash": "sha256:a3f1..." },
    { "order": 1, "hash": "sha256:9c2e..." },
    { "order": 2, "hash": "sha256:d410..." }
  ],
  "baseVersion": 6            // version this edit was made against
}

200 OK
{
  "missingChunks": ["sha256:d410..."],   // server already has the rest
  "uploadUrls": {                        // pre-signed S3 URLs
    "sha256:d410...": "https://s3.../chunks/d410?X-Amz-Signature=..."
  }
}

// Client PUTs missing chunks directly to blob storage, then:
POST /api/v1/files/{fileId}/commit/complete
{ "baseVersion": 6 }

201 Created
{ "version": 7 }`,
        },
        {
          id: 'api-2',
          type: 'markdown',
          content:
            'Note two deliberate choices: chunks go **directly to blob storage via pre-signed URLs** (your app servers never proxy petabytes), and the commit carries a `baseVersion` so the server can detect concurrent edits (Step 5).\n\nThe metadata schema is three tables — files, versions, and chunks:',
        },
        {
          id: 'api-schema',
          type: 'code',
          language: 'sql',
          filename: 'Metadata tables',
          code: `CREATE TABLE files (
  file_id          BIGINT PRIMARY KEY,
  owner_id         BIGINT NOT NULL,
  parent_folder_id BIGINT,
  name             VARCHAR(255) NOT NULL,
  current_version  INT NOT NULL,
  is_deleted       BOOLEAN DEFAULT false,
  updated_at       TIMESTAMP DEFAULT now()
);

CREATE TABLE file_versions (
  file_id      BIGINT NOT NULL,
  version      INT NOT NULL,
  size_bytes   BIGINT NOT NULL,
  device_id    BIGINT,                  -- which device produced it
  created_at   TIMESTAMP DEFAULT now(),
  PRIMARY KEY (file_id, version)
);

CREATE TABLE version_chunks (
  file_id      BIGINT NOT NULL,
  version      INT NOT NULL,
  chunk_order  INT NOT NULL,
  chunk_hash   CHAR(64) NOT NULL,       -- SHA-256, FK into chunk store
  PRIMARY KEY (file_id, version, chunk_order)
);

CREATE TABLE chunks (
  chunk_hash   CHAR(64) PRIMARY KEY,
  size_bytes   INT NOT NULL,
  ref_count    BIGINT NOT NULL DEFAULT 1  -- for garbage collection
);`,
        },
        {
          id: 'api-callout',
          type: 'callout',
          variant: 'info',
          title: 'Versioning falls out for free',
          content:
            'Because chunks are immutable and content-addressed, a "version" is just an ordered list of chunk hashes. Version 7 that changes one chunk of a 500-chunk file costs one new chunk plus one new row set in version_chunks — not a second copy of the file. Restore-to-previous-version is a metadata pointer flip.',
        },
      ],
    },
    {
      id: 'chunking',
      title: 'Step 4 — Chunking and deduplication (the core of the interview)',
      blocks: [
        {
          id: 'chunk-1',
          type: 'markdown',
          content:
            'This is where the interview is won or lost. Chunking solves four problems with one mechanism:\n\n1. **Resumable uploads** — a dropped connection at 95% of a 2 GB file loses one chunk, not the whole transfer.\n2. **Delta sync** — edit page 3 of a document and only the chunks covering page 3 change; the rest hash identically and never leave the device.\n3. **Deduplication** — chunks are identified by their SHA-256 **content hash**. If any user anywhere has already uploaded a chunk with that hash, it is never stored (or transferred) again.\n4. **Parallelism** — chunks upload and download over concurrent connections, saturating the pipe.\n\nDropbox uses **4 MB chunks**. The size is a trade-off: smaller chunks dedupe better and localize edits more tightly, but every chunk costs a metadata row and a request — a 2 GB file at 64 KB chunks is 32,768 rows. 4 MB keeps that same file at 512 chunks while still isolating most edits.\n\nThe subtle question is *where* the chunk boundaries go:',
        },
        {
          id: 'chunk-comparison',
          type: 'comparison',
          title: 'Fixed-size vs content-defined chunking',
          headers: ['Approach', 'How it works', 'Pros', 'Cons'],
          rows: [
            [
              'Fixed-size chunking',
              'Cut the byte stream every 4 MB, regardless of content',
              'Dead simple, fast, predictable chunk count',
              'Insert one byte at the start and every boundary shifts — all downstream chunks re-hash as "new", killing dedupe',
            ],
            [
              'Content-defined chunking (CDC)',
              'Slide a rolling hash (e.g., Rabin fingerprint) over the data; cut a boundary where the hash matches a pattern, averaging ~4 MB',
              'Boundaries stick to content — an insertion changes only nearby chunks; dedupe survives shifts',
              'More CPU per file, variable chunk sizes, harder to implement and explain',
            ],
          ],
        },
        {
          id: 'chunk-2',
          type: 'markdown',
          content:
            'A strong answer: start with **fixed-size 4 MB chunks** — it captures most of the win for append-heavy and in-place edits — then name the **boundary-shift problem** and offer content-defined chunking as the fix for insert-heavy workloads. Knowing *why* rsync and modern backup tools use rolling hashes is a senior signal; deriving Rabin fingerprints on the whiteboard is not required.\n\nOne caveat worth volunteering: **cross-user dedupe has a privacy wrinkle**. If the server admits "I already have that chunk," an attacker can probe whether anyone has stored a known file. Per-user dedupe or convergent encryption are the standard mitigations — one sentence on this earns real credit.',
        },
        {
          id: 'chunk-widget',
          type: 'widget',
          widgetId: 'chunking-dedupe-demo',
          title: 'Chunking and dedupe, live',
          caption:
            'Watch a file get split into chunks, hashed, and deduplicated — then edit the file and see delta sync upload only the chunks that changed.',
        },
      ],
    },
    {
      id: 'sync',
      title: 'Step 5 — Sync and consistency across devices',
      blocks: [
        {
          id: 'sync-1',
          type: 'markdown',
          content:
            'The sync loop has four players:\n\n- **Client watcher** — a daemon on each device watches the sync folder (inotify/FSEvents), chunks and hashes changed files, and talks to the API from Step 3. It keeps a local database of known hashes so offline edits queue up cleanly.\n- **Metadata service** — owns the metadata DB, which is the **single source of truth**. A file version does not exist until its commit lands here; blob storage is just a bag of chunks.\n- **Notification service** — when a commit lands, it pushes an invalidation ("file X is now version 7") to the user\'s other devices. Use **long polling or WebSockets**: with millions of mostly-idle devices, having clients poll every few seconds would melt the metadata tier, and long polling gets near-instant sync at a fraction of the request volume. The notification is deliberately tiny — just "something changed" — and the device then fetches the new chunk list and downloads only the chunks it lacks.\n- **Blob storage** — stores chunks keyed by hash; covered in Step 6.\n\n**Conflicts.** Two devices edit `budget.xlsx` offline, then both reconnect. Each commit carries the `baseVersion` it was edited against — the server accepts the first commit (version 6 → 7) and rejects the second because its base (6) is no longer current. Now what?',
        },
        {
          id: 'sync-comparison',
          type: 'comparison',
          title: 'Conflict resolution strategies',
          headers: ['Strategy', 'Behavior', 'When it fits'],
          rows: [
            [
              'Last-writer-wins',
              'Second commit silently overwrites — the losing edit is gone',
              'Ephemeral data (presence, cursors). Catastrophic for user files: it deletes someone\'s work without telling them',
            ],
            [
              'Conflicted copies',
              'Keep both: the second commit becomes "budget (conflicted copy — Bob\'s MacBook).xlsx" beside the original',
              'Opaque binary files where the system cannot merge — Dropbox\'s actual choice',
            ],
            [
              'Operational merge (OT/CRDT)',
              'Merge concurrent edits at the operation level',
              'Structured, format-aware data — Google Docs, not arbitrary files',
            ],
          ],
        },
        {
          id: 'sync-callout',
          type: 'callout',
          variant: 'warning',
          title: 'Why Dropbox creates conflicted copies',
          content:
            'Dropbox syncs arbitrary bytes — spreadsheets, PSDs, SQLite databases — and cannot merge formats it does not understand. Last-writer-wins would silently destroy one person\'s work, violating the product\'s core promise of never losing data. A conflicted copy is an honest failure: both versions survive, and a human resolves it. Saying "I\'d punt the merge to the user because the system can\'t safely do it" is a senior answer, not a cop-out.',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'Step 6 — Architecture at scale',
      blocks: [
        {
          id: 'arch-1',
          type: 'markdown',
          content:
            'Putting it together:\n\n- **Blob storage (S3 or equivalent)** holds every chunk, keyed by content hash. It gives you eleven-nines durability, effectively infinite capacity, and pre-signed URLs so app servers stay out of the data path. Interestingly, Dropbox famously ran on S3 for years, built its own storage layer (Magic Pocket) at extreme scale, and that is a cost-at-scale story worth a sentence — not a design you should propose.\n- **Cold storage tiering.** Most chunks are written once and never read again — old versions, forgotten files. Lifecycle rules move chunks untouched for 90+ days to infrequent-access or Glacier tiers, cutting storage cost 2–5× on the long tail. At 500 PB, tiering is worth more than most performance optimizations.\n- **Metadata DB**: sharded relational (e.g., MySQL/Postgres sharded by `owner_id` so one user\'s sync touches one shard), with the version tables from Step 3. Transactions matter here — a commit must atomically bump `current_version` and insert the chunk rows.\n- **Garbage collection**: when versions are pruned, decrement `ref_count` on their chunks; a background job deletes chunks that hit zero. Getting refcounting right (races between upload and GC) is a classic follow-up.\n\nOne design decision deserves an explicit trade-off — who does the chunking?',
        },
        {
          id: 'arch-tradeoff',
          type: 'tradeoff',
          title: 'Client-side chunking (vs server-side)',
          pros: [
            'Delta sync works: the client hashes locally and skips unchanged chunks — the only way to avoid uploading data the server already has',
            'Resumable uploads for free: retry individual chunks, not whole files',
            'Offloads CPU (hashing, compression) to millions of client devices instead of your fleet',
            'Chunks can go straight to blob storage via pre-signed URLs, keeping app servers stateless and thin',
          ],
          cons: [
            'Requires a smart client — a heavyweight desktop daemon, not just a browser form (web uploads need a server-side fallback path)',
            'Clients lie: every hash and size must be re-verified server-side or the chunk store gets poisoned',
            'Chunking logic ships in the client, so protocol changes wait on slow client-upgrade cycles',
            'Cross-platform consistency (macOS/Windows/Linux/mobile) multiplies engineering cost',
          ],
        },
      ],
    },
    {
      id: 'mistakes',
      title: 'Common mistakes that cost offers',
      blocks: [
        {
          id: 'mistakes-1',
          type: 'markdown',
          content:
            '1. **Storing files in the database.** BLOBs in Postgres at 500 PB is an instant red flag. Metadata in the DB, bytes in object storage — draw that line early.\n2. **Uploading whole files on every edit.** If your design re-transfers 2 GB because one paragraph changed, you have missed the point of the question. Chunking and delta sync *are* the question.\n3. **No conflict story.** "The last write wins" for user files means silently deleting someone\'s work. Interviewers push on offline edits precisely to see if you have thought about this.\n4. **Proxying file bytes through app servers.** Pre-signed URLs exist so your stateless tier never touches chunk data. Streaming petabytes through app servers is an expensive architectural mistake.\n5. **Polling for changes.** Ten million devices polling every five seconds is 2M QPS of "anything new?" — long polling or WebSockets cuts that by orders of magnitude.\n6. **Ignoring durability.** Never saying the words "replication" or "durability" on a question about storing people\'s only copy of their data is disqualifying at senior level.',
        },
        {
          id: 'mistakes-note',
          type: 'interviewNote',
          title: 'Senior-level signals',
          content:
            'Resumable uploads with per-chunk retry and an idempotent commit; compressing chunks based on content type (text compresses 5x, skip already-compressed video and JPEG); client-side bandwidth throttling and LAN sync so the daemon does not saturate the user\'s uplink; and the dedupe privacy caveat with convergent encryption. Any one of these, unprompted, moves your grade up a notch.',
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Why chunk files instead of uploading whole files?',
      answer:
        'Chunking gives you four wins at once: resumable uploads (a dropped connection retries one chunk, not the whole file), delta sync (only the chunks that changed are re-uploaded after an edit), deduplication (chunks identified by content hash are stored once even if a million users upload them), and parallel transfers. For a sync product where users repeatedly edit large files, transferring whole files would waste enormous bandwidth and storage.',
    },
    {
      question: 'How does Dropbox handle two people editing the same file?',
      answer:
        'Each commit records which version it was edited against. The first commit wins and creates the new version; the second is rejected because its base version is stale, and the client saves it as a separate conflicted copy file next to the original. Dropbox cannot merge arbitrary binary formats, so keeping both versions and letting a human resolve the conflict is safer than silently overwriting one person\'s work.',
    },
    {
      question: 'Should I use SQL or NoSQL for Dropbox metadata?',
      answer:
        'Relational is the stronger default here. Committing a new file version must atomically update the current version pointer and insert the chunk list, which is a natural multi-row transaction, and the data is relational: files reference versions, versions reference chunks. Shard by owner ID so each user\'s sync traffic hits one shard. A NoSQL store works too, but you must then explain how you get atomic commits, which is harder to defend.',
    },
    {
      question: 'How big should file chunks be?',
      answer:
        'Around 4 MB, which is what Dropbox uses. Smaller chunks deduplicate better and localize edits more precisely, but each chunk costs a metadata row, a hash, and a request, so tiny chunks explode overhead — a 2 GB file at 64 KB chunks is over 32,000 chunks versus 512 at 4 MB. 4 MB balances dedupe granularity against metadata and request overhead for typical file sizes.',
    },
  ],
};
