# Daily X kit

Papad Pixels posts to x.com/papadpixels by hand (no paid X API). Every
morning a Claude routine prepares that day's posts and sends them to the
owner in the Claude app. Nothing here is published on papadpixels.com
(the deploy workflow leaves `tools/` out).

## What the routine does

1. Work out today's date in Asia/Dubai (YYYY-MM-DD).
2. **Ad post.** If `ads.json` has an entry for today, it is today's ad:
   send its `text` exactly as written, plus its `video` link (a Google
   Drive file the owner downloads and attaches on X).
3. **AI news post.**
   - Use web search to find the most important news from the last
     24–48 hours about AI image or video generation: model launches and
     updates (Veo, Kling, Seedance, Wan, Runway, Luma, Midjourney, GPT
     Image, Flux, MiniMax, Pika, LTX…), big feature or pricing changes,
     or AI advertising news that matters to brands.
   - Only use a story that at least two independent outlets (or the
     company's own announcement) report. Never invent or guess details.
     If nothing new and confirmed happened, say so and send no news post.
   - Write the post in the Papad Pixels voice: what happened, then one
     line on why it matters for brands or creators. Then the source link
     (prefer the company's announcement or a well-known outlet), then 2–3
     hashtags. Max 280 characters as X counts them: every link counts as
     23 and every emoji as 2. Never mention any person's name from the
     Papad Pixels team.
4. **Image card.** Render it in the Papad Pixels style:

   ```
   NODE_PATH=$(npm root -g) node tools/xcard/render.js <scratchpad>/x-YYYY-MM-DD.png \
     '{"kicker":"AI News · DD Mon YYYY","headline":"Short headline with *gold words*","sub":"One plain sentence.","source":"Outlet name"}'
   ```

   Keep the headline under ~70 characters and wrap 1–3 key words in
   `*stars*` (they turn gold). Look at the PNG before sending it.
5. **Send** the PNG to the owner with SendUserFile (status: proactive),
   then one short message containing:
   - **Post 1 – AI ad** (if any): the caption in a code block, the video
     link, and "download the video and attach it on X".
   - **Post 2 – AI news**: the text in a code block, "attach the image above".
   - The sources you used for the news, as links.

   Do not commit or push anything.
