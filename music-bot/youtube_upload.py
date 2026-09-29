"""Upload a rendered mix (from build_mix.py) to YouTube.

One-time setup (see README): put your OAuth client file at
music-bot/client_secret.json. The first run opens a Google sign-in link and
saves token.json so later runs are fully automatic.

    python youtube_upload.py output/jazz_2026-09-29_1
    python youtube_upload.py output/jazz_2026-09-29_1 --publish-at 2026-10-01T14:00:00Z
    python youtube_upload.py output/jazz_2026-09-29_1 --privacy public --playlist PLxxxx
"""
import argparse
import json
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from common import ROOT, load_config

SCOPES = ["https://www.googleapis.com/auth/youtube"]
CLIENT_SECRET = ROOT / "client_secret.json"
TOKEN = ROOT / "token.json"


def get_service():
    creds = None
    if TOKEN.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CLIENT_SECRET.exists():
                raise SystemExit("Missing client_secret.json - see README 'YouTube API setup'.")
            flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET), SCOPES)
            creds = flow.run_local_server(port=8080, open_browser=True)
        TOKEN.write_text(creds.to_json())
    return build("youtube", "v3", credentials=creds)


def upload(folder, privacy, publish_at, playlist):
    cfg = load_config()["youtube"]
    folder = Path(folder)
    meta = json.loads((folder / "metadata.json").read_text(encoding="utf-8"))
    yt = get_service()

    status = {
        "privacyStatus": "private" if publish_at else privacy,
        "selfDeclaredMadeForKids": cfg["made_for_kids"],
        "containsSyntheticMedia": cfg["contains_synthetic_media"],
    }
    if publish_at:
        status["publishAt"] = publish_at

    body = {
        "snippet": {
            "title": meta["title"],
            "description": meta["description"],
            "tags": meta["tags"],
            "categoryId": cfg["category_id"],
            "defaultLanguage": cfg["default_language"],
            "defaultAudioLanguage": "zxx",  # no linguistic content (instrumental)
        },
        "status": status,
    }

    media = MediaFileUpload(str(folder / "video.mp4"), chunksize=16 * 1024 * 1024,
                            resumable=True, mimetype="video/mp4")
    req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    resp = None
    while resp is None:
        progress, resp = req.next_chunk()
        if progress:
            print(f"Uploading... {progress.progress() * 100:.0f}%")
    video_id = resp["id"]
    print(f"Uploaded: https://youtu.be/{video_id}")

    thumb = folder / "thumbnail.jpg"
    if thumb.exists():
        try:
            yt.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(str(thumb))).execute()
            print("Thumbnail set.")
        except Exception as e:  # needs a phone-verified channel
            print(f"Thumbnail skipped: {e}")

    if playlist:
        yt.playlistItems().insert(part="snippet", body={"snippet": {
            "playlistId": playlist,
            "resourceId": {"kind": "youtube#video", "videoId": video_id},
        }}).execute()
        print(f"Added to playlist {playlist}")

    meta["youtube_id"] = video_id
    (folder / "metadata.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False),
                                          encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("folder", help="output folder created by build_mix.py")
    ap.add_argument("--privacy", default=load_config()["youtube"]["privacy"],
                    choices=["private", "unlisted", "public"])
    ap.add_argument("--publish-at", help="schedule, ISO 8601 UTC e.g. 2026-10-01T14:00:00Z")
    ap.add_argument("--playlist", help="playlist ID to add the video to")
    args = ap.parse_args()
    upload(args.folder, args.privacy, args.publish_at, args.playlist)


if __name__ == "__main__":
    main()
