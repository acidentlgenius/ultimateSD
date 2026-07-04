import { Guide } from '@/lib/guides';

export const youtubeGuide: Guide = {
  metadata: {
    slug: 'design-youtube',
    problemSlug: 'design-youtube',
    title: 'Design YouTube (Video Streaming Service)',
    seoTitle: 'Design YouTube — System Design Interview Guide',
    description:
      'Step-by-step guide to the "Design YouTube" system design interview question: requirements, capacity estimation, resumable uploads, the transcoding pipeline, adaptive bitrate streaming (HLS/DASH), CDN delivery, and view counting at scale. Includes an interactive ABR simulator.',
    publishedAt: '2026-07-04',
    updatedAt: '2026-07-04',
    readingTime: '16 min read',
    keywords: [
      'design youtube system design',
      'video streaming system design interview',
      'netflix system design',
      'adaptive bitrate streaming',
      'CDN video delivery',
      'video transcoding pipeline',
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
            'Design YouTube (or Netflix, or any video streaming service) is the canonical **heavy-media pipeline** question. Unlike TinyURL, the hard part is not a clever data structure — it is moving petabytes of video from an uploader\'s laptop to a billion screens, cheaply and smoothly. In 45 minutes it tests whether you can design an **asynchronous processing pipeline**, reason about **blob storage vs databases**, explain **how streaming actually works** (most candidates cannot), and show **cost awareness** — because at this scale, bandwidth is the business.\n\nThe question splits cleanly into two halves: the **upload/transcode path** (write-heavy, async, throughput-oriented) and the **watch path** (read-heavy, latency-oriented, CDN-dominated). Structuring your answer around those two paths is itself a senior signal.',
        },
        {
          id: 'why-callout',
          type: 'callout',
          variant: 'tip',
          title: 'The 30-second answer',
          content:
            'Users upload the raw video to blob storage via resumable, pre-signed URLs. An async pipeline transcodes it into multiple resolutions and formats, split into small segments, and writes them back to blob storage. Viewers fetch a manifest and stream segments through a CDN, with the client switching quality per-segment based on measured bandwidth (adaptive bitrate). Video metadata lives in a regular database; view counts are aggregated separately because they are too hot to write per-view.',
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
            '**Functional requirements**\n\n- Users can **upload** videos (large files — assume up to tens of GB).\n- Users can **watch** videos — this is the product; smooth playback is the requirement, not just "serve the file".\n- Users can see **view counts** on videos.\n- (Clarify) **Search** — call it out, then de-scope it. It is its own interview (an inverted index / Elasticsearch discussion).\n- (Clarify) **Comments, likes, subscriptions, recommendations** — explicitly de-scope. Interviewers want the video pipeline, not a social network.\n\n**Non-functional requirements**\n\n- **High availability** on the watch path — playback failures are the product failing.\n- **Low startup latency** — video should begin playing in well under a second of pressing play.\n- **Smooth playback on flaky networks** — a viewer on a train should get lower quality, not a frozen spinner. This one requirement drives the entire adaptive bitrate design.\n- **Durability of uploads** — a creator\'s 20 GB upload must never be lost mid-way or after ingest.\n- Uploads can take minutes to become watchable — **processing is async**, and that is acceptable. Say this explicitly; it buys you an enormous amount of design freedom.',
        },
        {
          id: 'req-note',
          type: 'interviewNote',
          title: 'Name the two paths',
          content:
            'The most useful sentence early in this interview: "There are two very different workloads here — a write-heavy async upload path and a read-heavy latency-sensitive watch path — and I will design them separately." It gives your whole answer a skeleton and tells the interviewer you see the shape of the problem.',
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
            'Use YouTube\'s public-ish numbers:\n\n- **Uploads:** ~500 hours of video uploaded **per minute** → 720,000 hours/day ≈ 43M minutes of source video per day.\n- **Storage (source):** one minute of 1080p source at ~5 Mbps ≈ ~40–50 MB. So ingest is roughly `43M min × 50 MB` ≈ **~2 PB of raw video per day**.\n- **Storage (transcoded):** each video is stored in ~5–6 renditions (240p → 4K). Lower renditions are much smaller, so the full ladder roughly **doubles** source storage → **~4–5 PB/day written**, forever. This is why cold/archival tiers for old, unwatched videos matter.\n- **Watch:** ~1B hours watched per day = 60B minutes. At an average delivered bitrate of ~1.5 Mbps (mostly mobile/720p) ≈ ~11 MB/min → **~600+ PB/day of egress**.\n\nThat last number is the punchline: **egress is 100×+ the daily storage growth**. Even at heavily negotiated pricing of ~$0.01/GB, 600 PB/day is **millions of dollars per day** in bandwidth. Storage is a rounding error next to delivery. Every architectural choice on the watch path — CDN, compression efficiency, per-title encoding — is really a bandwidth-cost decision.',
        },
        {
          id: 'cap-callout',
          type: 'callout',
          variant: 'info',
          title: 'What the numbers buy you',
          content:
            'Petabytes/day rules out anything but distributed blob storage (S3/GCS-style). A 100:1 egress-to-ingest ratio makes the CDN non-optional — no origin cluster serves 600 PB/day. And "millions per day in bandwidth" justifies spending real engineering effort on better codecs: a 20% bitrate saving from AV1 is worth hundreds of thousands of dollars daily.',
        },
        {
          id: 'cap-widget',
          type: 'widget',
          widgetId: 'capacity-calculator',
          title: 'Capacity calculator',
          caption:
            'Plug in your own assumptions (upload rate, watch hours, bitrates) and watch storage and egress estimates update live — notice how egress dwarfs everything else.',
        },
      ],
    },
    {
      id: 'api',
      title: 'Step 3 — API design and metadata schema',
      blocks: [
        {
          id: 'api-1',
          type: 'markdown',
          content:
            'The key API insight: **video bytes never flow through your app servers**. The app server hands out pre-signed URLs and the client uploads directly to blob storage, in chunks, so a dropped connection resumes instead of restarting a 20 GB transfer.',
        },
        {
          id: 'api-upload',
          type: 'code',
          language: 'http',
          filename: 'Resumable upload with pre-signed URLs',
          code: `POST /api/v1/videos
{ "title": "My video", "description": "...", "sizeBytes": 21474836480 }

201 Created
{
  "videoId": "vid_8f3kz",
  "uploadUrls": [                       // one pre-signed URL per chunk
    { "part": 1, "url": "https://blob.example.com/...&sig=..." },
    { "part": 2, "url": "https://blob.example.com/...&sig=..." }
  ]
}

// Client PUTs each ~10 MB chunk directly to blob storage,
// retrying only failed parts, then finalizes:
POST /api/v1/videos/vid_8f3kz/complete
{ "parts": [{ "part": 1, "etag": "..." }, { "part": 2, "etag": "..." }] }

202 Accepted
{ "status": "PROCESSING" }              // transcoding starts async

GET /api/v1/videos/vid_8f3kz
{ "status": "READY", "manifestUrl": "https://cdn.example.com/vid_8f3kz/master.m3u8" }`,
        },
        {
          id: 'api-schema',
          type: 'code',
          language: 'sql',
          filename: 'videos and encodings tables',
          code: `CREATE TABLE videos (
  video_id     VARCHAR(20) PRIMARY KEY,
  uploader_id  BIGINT NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  status       VARCHAR(20) NOT NULL,      -- UPLOADING | PROCESSING | READY | FAILED
  duration_s   INT,
  source_url   TEXT,                      -- raw upload in blob storage
  manifest_url TEXT,                      -- master HLS/DASH manifest
  created_at   TIMESTAMP DEFAULT now()
);

CREATE TABLE encodings (
  video_id     VARCHAR(20) REFERENCES videos(video_id),
  resolution   VARCHAR(10),               -- '1080p', '720p', ...
  codec        VARCHAR(10),               -- 'h264', 'vp9', 'av1'
  bitrate_kbps INT,
  segment_path TEXT,                      -- prefix of segment files in blob storage
  status       VARCHAR(20) NOT NULL,
  PRIMARY KEY (video_id, resolution, codec)
);`,
        },
        {
          id: 'api-2',
          type: 'markdown',
          content:
            'Metadata is tiny relative to the video bytes — even billions of videos are a few TB of rows. A relational database (sharded by `video_id` at extreme scale) is fine; the interesting scaling problems live elsewhere. The `status` column matters more than it looks: it is what powers the "processing…" state in the UI and the callback when the video goes live.',
        },
      ],
    },
    {
      id: 'transcoding',
      title: 'Step 4 — The transcoding pipeline (the core, part 1)',
      blocks: [
        {
          id: 'trans-1',
          type: 'markdown',
          content:
            '**Why transcode at all?** Three reasons, and you should say all three:\n\n1. **Devices and codecs** — a phone, a smart TV, and an old browser support different codecs (H.264 everywhere, VP9/AV1 where possible for ~30–50% bitrate savings).\n2. **Resolutions** — a viewer on 3G cannot use a 4K stream; you need a ladder of renditions (240p, 360p, 480p, 720p, 1080p, 4K) so the client can pick.\n3. **Segments** — the video is split into small chunks (~2–6 seconds each) so playback can start after downloading one segment and quality can switch at any segment boundary.\n\n**Pipeline shape:** upload completion drops a message onto a **queue**. A pool of **workers** picks it up and executes a **DAG of tasks**: split the source into segments → transcode each segment into every (resolution × codec) pair in parallel → generate thumbnails → run content/copyright checks → assemble manifests → mark the video `READY`. The DAG matters because steps have dependencies (manifests need all segments done) but the expensive middle is embarrassingly parallel.',
        },
        {
          id: 'trans-comparison',
          type: 'comparison',
          title: 'Whole-file vs segmented parallel transcoding',
          headers: ['Approach', 'How it works', 'Pros', 'Cons'],
          rows: [
            [
              'Whole-file transcoding',
              'One worker transcodes the entire video per rendition',
              'Simple; best compression (encoder sees the whole video)',
              'A 4-hour video takes hours; one worker failure restarts everything; huge machines needed',
            ],
            [
              'Segmented parallel transcoding',
              'Split into segments; hundreds of workers each transcode one segment; stitch results',
              'Near-constant wall-clock time regardless of length; retries are per-segment and cheap; scales with cheap workers',
              'Split/stitch coordination; slightly worse compression at segment boundaries',
            ],
          ],
        },
        {
          id: 'trans-2',
          type: 'markdown',
          content:
            'Segmented parallelism is the right answer at YouTube scale, and it composes beautifully with the queue: each segment-transcode task is an idempotent message, workers are stateless and preemptible (spot instances — transcoding is the classic spot workload), and a dead worker just means one small task gets redelivered. A **DAG scheduler** (or a simple state machine over the `encodings` table) tracks completion and triggers manifest assembly when the last segment lands.',
        },
        {
          id: 'trans-callout',
          type: 'callout',
          variant: 'warning',
          title: 'Why upload must be async',
          content:
            'Never design a synchronous upload-and-process flow. Transcoding a long video takes minutes even fully parallelized, and no HTTP request should live that long. Accept the upload, return 202 with a video in PROCESSING state, and notify the client via polling, WebSocket, or a webhook when it flips to READY. Interviewers deliberately probe this — a candidate who keeps the client connection open during processing fails the question.',
        },
      ],
    },
    {
      id: 'streaming',
      title: 'Step 5 — Streaming and adaptive bitrate (the core, part 2)',
      blocks: [
        {
          id: 'stream-1',
          type: 'markdown',
          content:
            'This is where most candidates hand-wave, and where you can pull ahead by explaining how streaming **actually works**: it is just HTTP file downloads, orchestrated by the client.\n\nThe two dominant protocols are **HLS** (Apple, `.m3u8` manifests) and **DASH** (MPEG standard, `.mpd`) — same idea, different container formats:\n\n1. The player fetches a **master manifest**: a small text file listing the available renditions (`1080p @ 5 Mbps`, `720p @ 2.5 Mbps`, …) and where their segment lists live.\n2. Each rendition has a **media playlist** enumerating its segments: `seg_0001.ts`, `seg_0002.ts`, … each ~2–6 seconds of video.\n3. The player downloads segments sequentially over plain HTTP and feeds them to the decoder.\n\n**Adaptive bitrate (ABR)** is the client-side loop on top: the player continuously measures **download throughput** and **buffer level**. Buffer growing and throughput high → step up a rendition at the next segment boundary. Buffer draining → step down immediately, because a rebuffer (frozen spinner) is the worst possible outcome. All the intelligence lives in the client; the server is a dumb file server — which is precisely what makes this design scale.',
        },
        {
          id: 'stream-widget',
          type: 'widget',
          widgetId: 'abr-simulator',
          title: 'Adaptive bitrate, live',
          caption:
            'Watch a player react to changing bandwidth: throttle the network and see it drop renditions to protect the buffer, then climb back up when conditions improve — exactly the loop running in every YouTube player.',
        },
        {
          id: 'stream-callout',
          type: 'callout',
          variant: 'warning',
          title: 'Never stream the raw file',
          content:
            'Serving the original upload directly fails on every requirement: one fixed bitrate means mobile users buffer forever and Wi-Fi users get worse quality than their connection allows; there is no mid-stream quality switching; seeking requires range-request gymnastics; and you pay egress for bits the viewer\'s network cannot use. Segments plus a rendition ladder is not an optimization — it is the design.',
        },
      ],
    },
    {
      id: 'cdn',
      title: 'Step 6 — CDN and global delivery',
      blocks: [
        {
          id: 'cdn-1',
          type: 'markdown',
          content:
            'Segments are static, immutable files — the perfect CDN workload. Viewers fetch manifests and segments from an **edge server** near them; on a miss, the edge pulls from an **origin shield** (a regional cache layer), which pulls from blob storage. The shield matters: without it, a cache-cold viral video makes thousands of edges hammer the origin simultaneously; with it, the origin sees roughly one fetch per segment per region.\n\nCaching behavior follows viewing behavior, which is brutally skewed: a small fraction of videos generate almost all watch time, while the **long tail** — billions of videos with a handful of views each — is watched so rarely that caching it is pure waste. That skew drives the central CDN decision:',
        },
        {
          id: 'cdn-tradeoff',
          type: 'tradeoff',
          title: 'Push everything to CDN vs cache hot content only',
          pros: [
            'Push-everything: every video is fast everywhere from the first view',
            'Push-everything: no origin load spikes when something suddenly gets traffic',
            'Push-everything: simple mental model — CDN is the source of truth for delivery',
          ],
          cons: [
            'Storing 5+ renditions of every video at hundreds of edge locations multiplies storage cost by orders of magnitude',
            'The long tail makes it wasteful: most videos would sit at the edge and never be requested there',
            'Pull-through caching with TTL eviction achieves ~95%+ hit rates on hot content anyway — the right answer is pull-based caching, with selective pre-warming for content you can predict (new uploads from huge channels, trending videos)',
          ],
        },
        {
          id: 'cdn-widget',
          type: 'widget',
          widgetId: 'cdn-map',
          title: 'CDN delivery, visualized',
          caption:
            'See requests route to the nearest edge, hit or miss the cache, and fall back through the origin shield to blob storage — and watch hit rates climb as a video gets hot.',
        },
        {
          id: 'cdn-2',
          type: 'markdown',
          content:
            'Two refinements worth mentioning unprompted: **popularity-aware placement** (hot segments replicated to every edge, warm content only at regional shields, cold long-tail served straight from origin) and **pre-warming** — when a 100M-subscriber channel publishes, push the first minute of segments to edges before the notification blast goes out, because you know the thundering herd is coming.',
        },
      ],
    },
    {
      id: 'view-counts',
      title: 'Step 7 — View counts at scale',
      blocks: [
        {
          id: 'views-1',
          type: 'markdown',
          content:
            'A naive `UPDATE videos SET views = views + 1` melts on a viral video: millions of writes per minute contending on a single hot row. The fix is to stop counting synchronously:\n\n- Players emit view events to a **log/queue** (Kafka-style). Nothing on the watch path writes to the database.\n- Aggregation workers consume the stream, sum counts per video over a window (say, 10–30 seconds), and flush **one batched update per video per window** — turning a million increments into a handful.\n- Displayed counts are eventually consistent by seconds, which nobody notices or cares about on a view counter.\n\nIf asked about exactness: exact counting matters for **monetization** (creators are paid per view), so the event log is the durable source of truth and batch jobs reconcile precise counts; the real-time displayed number can tolerate approximation. Mentioning approximate structures (like HyperLogLog for *unique* viewers) is a nice flourish — but know that HLL answers "how many distinct users", not "how many views".',
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
            '1. **Streaming the raw file** — no transcoding, no segments, no ABR. This is the single most common failure; it reveals the candidate does not know how video delivery works.\n2. **Synchronous upload processing** — holding the client connection while transcoding runs. Upload must be async with a status machine and callbacks.\n3. **Putting video bytes in the database** — video lives in blob storage; the database holds metadata and pointers. Full stop.\n4. **Ignoring the CDN or treating it as an afterthought** — at 600 PB/day of egress, the CDN *is* the watch path, not a bolt-on.\n5. **No resumable uploads** — restarting a 20 GB upload from zero on a dropped connection is a design bug, not a corner case.\n6. **Never mentioning cost** — this is the rare question where the dominant constraint is a bill. Candidates who never say the word "egress" leave the strongest signal on the table.',
        },
        {
          id: 'mistakes-note',
          type: 'interviewNote',
          title: 'Senior-level signals',
          content:
            'Resumable chunked uploads via pre-signed URLs; per-title encoding (analyze each video and tune its bitrate ladder instead of one global ladder — Netflix\'s trick, worth ~20% bandwidth); pre-warming CDN edges before a predictable viral release; spot instances for the transcoding fleet; and framing codec choice (H.264 vs VP9 vs AV1) as a bandwidth-cost-versus-compute-cost trade. Any two of these, unprompted, and you are grading as senior — because they all show you understand that egress is the business.',
        },
      ],
    },
  ],
  faq: [
    {
      question: 'How does YouTube stream video so fast?',
      answer:
        'Videos are pre-transcoded into multiple resolutions and split into small segments of a few seconds each, all stored as static files. When you press play, the player fetches a tiny manifest and the first low-quality segment from a CDN edge server physically near you, so playback starts almost instantly. The player then upgrades quality segment by segment as it measures your available bandwidth.',
    },
    {
      question: 'What is adaptive bitrate streaming?',
      answer:
        'Adaptive bitrate streaming (used by HLS and DASH) stores each video in several quality levels, split into short segments. The video player continuously measures download speed and buffer health, and picks the quality level for each next segment: it steps down when the network degrades to avoid freezing, and steps back up when bandwidth allows. All the switching logic runs in the client, which keeps the servers simple and scalable.',
    },
    {
      question: 'Why does YouTube transcode videos into multiple formats?',
      answer:
        'Three reasons: different devices support different codecs (H.264 is universal, VP9 and AV1 save 30 to 50 percent bandwidth where supported); different network conditions need different resolutions, from 240p on weak mobile connections to 4K on fast Wi-Fi; and splitting the video into short segments enables fast startup, seeking, and mid-stream quality switching. The original upload is kept as the source, but viewers never receive it directly.',
    },
    {
      question: 'Should I use SQL or NoSQL for YouTube metadata?',
      answer:
        'Video metadata (titles, uploader, status, rendition info) is small compared to the video bytes and fits comfortably in a relational database, sharded by video ID at extreme scale. The videos themselves belong in blob storage, not any database. The genuinely hard scaling problems in this design are the transcoding pipeline and CDN egress, so interviewers care that you put bytes in blob storage and justify your metadata choice briefly, not which database brand you pick.',
    },
  ],
};
