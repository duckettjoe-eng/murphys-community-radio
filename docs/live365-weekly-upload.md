# Live365 weekly upload formula

This is the repeatable flow for MCR mixes and new music uploads.

## Safety rule

Use the logged-in Live365 browser session only. Do not ask for, print, save, or commit the Live365 password or bearer token.

The helper script reads the local Codex browser session token into memory for the upload run, then discards it when the process exits.

## Weekly input folders

- MP3 upload folder: `/Users/joe/Desktop/MCR Live365 Upload MP3 Only`
- Cue sheet root: `/Users/joe/Desktop/spotify-live365-cues/output`
- Live365 station ID: `40167`

## Formula

1. Put final MP3-only show files in the upload folder.
2. Put Live365 cue sheets under the cue sheet root.
3. Run a dry run:

   ```sh
   npm run live365:weekly-upload
   ```

4. Confirm the dry run says the right MP3s are ready and shows any missing cue sheets.
5. Run the upload:

   ```sh
   npm run live365:weekly-upload -- --apply
   ```

6. The script skips Alt Rock/Alt Bar Room items by default, because those were already added.
7. Existing Live365 tracks with cue metadata are skipped.
8. Existing Live365 tracks without cue metadata get cue sheets attached.
9. New files are uploaded as Live365 Multitracks one at a time, then their cue sheets are attached.

The script also handles current Live365 quirks:

- Some uploaded titles come from embedded MP3 metadata instead of filenames; known aliases are included.
- Empty or invalid year values are removed before cue metadata is saved.
- Cue markers beyond the MP3 duration are trimmed.
- Cue sheets are thinned to Live365 marker-density limits: no more than 5 markers in 10 minutes and no more than 13 markers in 30 minutes.

## Useful options

Attach cues only to files that already exist in Live365:

```sh
npm run live365:weekly-upload -- --apply --attach-existing-only
```

Run only one matching file:

```sh
npm run live365:weekly-upload -- --only "Cali Sun"
```

Use different folders:

```sh
npm run live365:weekly-upload -- --upload-dir "/path/to/mp3s" --cue-root "/path/to/cues"
```

List Live365 tracks and marker counts for verification:

```sh
npm run live365:weekly-upload -- --list-live
```

## Current known cue mappings

The script includes the current batch cue mappings for:

- Cali Sun Reggae Ride
- Campfire Americana
- Golden Hour Groove
- House Party Frequency
- Lowrider Soul Sunday
- SITH Mix 1
- Skull County Garage Gospel
- Weird Late-Night FM

Files without cue mappings are reported and skipped until their cue sheets are added.

## June 2026 upload result

The cue-matched batch was uploaded or updated in Live365:

- Cali Sun Reggae Ride 5.30.2026: 18 markers
- Campfire Americana 5.30.2026: 15 markers
- Golden Era Groove 5.14.26: 14 markers
- Golden Hour Groove 6.4.2026: 14 markers
- House Party Frequency 6.5.2026: 20 markers
- Lowrider Soul Sunday 5.31.2026: 18 markers
- Stay In The House Mix: 7 markers
- Skull County Garage Gospel 5.31.2026: 20 markers
- Weird Late-Night FM 5.29.2026: 23 markers
- Night FM 6.5.2026: 25 markers

The following files still need cue mappings before the weekly automation will upload them:

- ATCQ MIX CLEAN.mp3
- Deep Diving - DJ Aquarobotics.mp3
- Don-ette G Premiere Mix+LadyG+Solution+Life.mp3
- Dusty Crates Hip Hop 6.5.2026.mp3
- Golden Era Mix w Drops Clean.mp3
- Limelight1.mp3
- Reflections - DJ Aquarobotics.mp3
- Saturday Quick Mix 3.13.21 CLEAN.mp3

## June 2026 scheduling result

Created replay categories:

- Replay - Golden Hour Groove
- Replay - Alt-Rock Barroom Radio
- Replay - Dusty Crate Hip-Hop Hour
- Replay - House Party Frequency
- Replay - Weird Late-Night FM
- Replay - Cali Sun Reggae Ride
- Replay - Campfire Americana
- Replay - Lowrider Soul Sunday
- Replay - Skull County Garage Gospel

Assigned ready multitracks to their replay categories. Dusty remains empty because the skipped Dusty MP3 has no cue-backed ready multitrack yet.

Created replay playlists:

- Replay Playlist - Thursday Shows
- Replay Playlist - Friday Shows
- Replay Playlist - Saturday Shows
- Replay Playlist - Sunday Shows

Created remaining ready show events:

- Thursday 7 PM: Alt-Rock Barroom Radio
- Friday 7 PM: House Party Frequency
- Friday 8 PM: Weird Late-Night FM
- Saturday 7 PM: Campfire Americana
- Sunday 11 AM: Skull County Garage Gospel

Created replay events:

- Friday 9-11 PM: Replay Block - Friday Shows
- Saturday 8-10 PM: Replay Block - Saturday Shows
- Sunday 12-2 PM: Replay Block - Sunday Shows

Not created:

- Thursday 8-10 PM replay block: Live365 rejected the immediate Alt Rock replay because album separation rules would be violated after the Thursday 7 PM Alt-Rock Barroom Radio show.
- Friday 6 PM Dusty Crate Hip-Hop Hour: no ready cue-backed multitrack.
- Saturday 6 PM Mashup Crate Hour: source file still unclear.

Live365 rejected clockwheel-based replay blocks for multitrack replay categories with `Category ... has no Tracks assigned`, so replay blocks were built with playlists instead. Some archive multitracks also triggered `Multitrack has no subtracks registered` when used inside replay playlists; the Thursday/Saturday replay playlists were narrowed to schedulable multitracks.
