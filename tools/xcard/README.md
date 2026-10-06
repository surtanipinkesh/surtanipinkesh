# Daily X news post

Every morning a Claude routine writes one AI-news post for
x.com/papadpixels and hands it to the posting robot
(github.com/surtanipinkesh/papad-social), which posts it through the X API.
Nothing here is published on papadpixels.com (the deploy workflow leaves
`tools/` out). AI ads go to X straight from the robot's own post files.

## What the routine does

1. Work out today's date in Asia/Dubai (YYYY-MM-DD).
2. **Find the news.**
   - Use web search to find the most important news from the last
     24–48 hours about AI image or video generation: model launches and
     updates (Veo, Kling, Seedance, Wan, Runway, Luma, Midjourney, GPT
     Image, Flux, MiniMax, Pika, LTX…), big feature or pricing changes,
     or AI advertising news that matters to brands.
   - Only use a story that at least two independent outlets (or the
     company's own announcement) report. Never invent or guess details.
     If nothing new and confirmed happened, post nothing that day.
   - Do not repeat a story already posted: check `posts/*-x-ai-news.yml`
     in papad-social.
3. **Write the post so it explains the news on its own.** A reader should
   understand the story without going anywhere else:
   - what happened and who did it, in plain words;
   - the key details: what is new, who can use it, where, when, price or
     limits if known;
   - one line on why it matters for brands or creators.

   Then 2–3 hashtags. **No links and no "read more" / "via" pointers**
   (posts with links cost more on X; the robot rejects them). Max 280
   characters as X counts them (every emoji counts as 2). Never mention
   any person's name from the Papad Pixels team.
4. **Image card.** It carries the extra detail that does not fit in the
   text: a short headline plus 2–3 key facts as bullet points. The source
   is credited small in the corner. Render it straight into the robot's
   repository and look at the PNG before using it:

   ```
   NODE_PATH=$(npm root -g) node tools/xcard/render.js /home/user/papad-social/media/x-news/YYYY-MM-DD.png \
     '{"kicker":"AI News · DD Mon YYYY","headline":"Short headline with *gold words*","points":["Key fact one","Key fact two","Key fact three"],"source":"Outlet or company"}'
   ```

   Keep the headline under ~60 characters with 1–3 key words in
   `*stars*` (they turn gold), and each point under ~75 characters.
   (`"sub":"One sentence"` works instead of `points` for a very simple
   story.)
5. **Hand it to the robot.** In papad-social, add
   `posts/YYYY-MM-DD-1230-x-ai-news.yml`:

   ```yaml
   publish_at: YYYY-MM-DD 12:30   # India time = 11:00 Dubai
   image: media/x-news/YYYY-MM-DD.png
   x:
     text: "…"
   ```

   Run `python poster.py list` to check it, then commit and push to main.
6. Tell the owner in one or two lines what will go out today.
