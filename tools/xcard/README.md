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
3. **Write the post** in the Papad Pixels voice: what happened, then one
   line on why it matters for brands or creators, then "via <outlet>",
   then 2–3 hashtags. **No links of any kind** (posts with links cost
   more on X; the robot rejects them). Max 280 characters as X counts
   them (every emoji counts as 2). Never mention any person's name from
   the Papad Pixels team.
4. **Image card.** Render it in the Papad Pixels style straight into the
   robot's repository, and look at the PNG before using it:

   ```
   NODE_PATH=$(npm root -g) node tools/xcard/render.js /home/user/papad-social/media/x-news/YYYY-MM-DD.png \
     '{"kicker":"AI News · DD Mon YYYY","headline":"Short headline with *gold words*","sub":"One plain sentence.","source":"Outlet name"}'
   ```

   Keep the headline under ~70 characters and wrap 1–3 key words in
   `*stars*` (they turn gold).
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
