# Design YouTube — social pack

## LinkedIn caption

"Just upload to S3 and serve it through a CDN."

That answer takes 30 seconds. The interview is 45 minutes. The round is decided on what happens in between — and it's usually three follow-ups that do the damage.

Swipe through for the three that break most candidates:

1. "Why can't you just serve the uploaded file?" — the transcoding pipeline: rendition ladders, codecs, and why hundreds of workers transcode segments in parallel.

2. "The user's bandwidth drops mid-video — what happens?" — adaptive bitrate streaming, and why all the intelligence lives in the client while the server stays a dumb file server.

3. "1M people watch one video, 1 person watches another — same infra?" — CDN edge caching for the hot set, why pushing everything to the edge is wasteful for the long tail, and why egress cost is the real constraint.

I wrote the full guide, free, with an interactive ABR simulator embedded in it — throttle the network and watch the player protect its buffer:
ultimate-sd.vercel.app/guides/design-youtube

Then practice it out loud, with an interviewer that keeps poking holes (chat + diagram):
ultimate-sd.vercel.app/practice/design-youtube

Launch offer — 50 slots, ends July 15: 3 months of Platform free.

#systemdesign #interviewprep #softwareengineering

## X thread

1/ Your video plays instantly at 4K on wifi and keeps playing in a tunnel — the mechanism is simpler than you think. Short thread on how video streaming actually works (and why it's a system design interview favorite). [attach GIF/carousel images]

2/ First: the file you upload is never the file people watch. It gets transcoded into a ladder of renditions — 240p up to 4K, in multiple codecs — because a phone on 3G and a TV on fiber need completely different streams.

3/ Each rendition is split into small segments, a few seconds each, all static files. A manifest is just a text file listing what's available and where. HLS and DASH are the same idea with different container formats.

4/ The "adaptive" part runs entirely in your player. It measures download speed and buffer level, and picks the quality of each next segment: buffer draining → step down, bandwidth back → step up. The server does nothing. That's why it scales.

5/ The follow-up that separates candidates: delivery cost. Egress is 100x+ daily storage growth — at YouTube scale, bandwidth is millions of dollars per day. Hot videos live at CDN edges; caching the long tail everywhere would be pure waste.

6/ I wrote the full free guide — requirements to view counting, with an interactive ABR simulator embedded so you can throttle the network and watch the player react: ultimate-sd.vercel.app/guides/design-youtube

## Media

Run `node scripts/generate-linkedin-media.mjs youtube` — outputs PNGs to marketing/linkedin/output/youtube/.
