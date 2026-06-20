use chrono::Utc;
use lofty::config::WriteOptions;
use lofty::file::{AudioFile, TaggedFileExt};
use lofty::tag::{Accessor, Tag};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;
use symphonia::core::errors::Error as SymphoniaError;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use symphonia::default::get_probe;
use tauri::{AppHandle, Emitter, Manager};
use uuid::Uuid;
use walkdir::WalkDir;

const AUDIO_EXTENSIONS: &[&str] = &[
    "aac", "aif", "aiff", "alac", "flac", "m4a", "mp3", "mp4", "wav",
];

#[derive(Debug, Serialize, Clone)]
struct ScanProgress {
    phase: String,
    current: usize,
    total: usize,
    path: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
struct ScanSummary {
    scan_id: String,
    root: String,
    track_count: usize,
    total_bytes: i64,
    known_runtime_seconds: f64,
    unknown_runtime_count: usize,
}

#[derive(Debug, Serialize, Clone)]
struct TrackRow {
    path: String,
    relative_folder: String,
    filename: String,
    extension: String,
    file_size_bytes: i64,
    title: String,
    artist: String,
    album: String,
    genre: String,
    year: String,
    duration_seconds: Option<f64>,
    proposed_bucket: String,
    live365_readiness: String,
    scan_status: String,
    metadata_dirty: bool,
    tag_write_status: String,
}

#[derive(Debug, Deserialize)]
struct TrackMetadataUpdate {
    scan_id: String,
    path: String,
    title: String,
    artist: String,
    album: String,
    genre: String,
    year: String,
    proposed_bucket: String,
    live365_readiness: String,
}

#[derive(Debug, Deserialize)]
struct BulkMetadataUpdate {
    scan_id: String,
    paths: Vec<String>,
    artist: Option<String>,
    album: Option<String>,
    genre: Option<String>,
    year: Option<String>,
    proposed_bucket: Option<String>,
    live365_readiness: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ExportArgs {
    format: String,
    tier: String,
    paths: Option<Vec<String>>,
    folder: Option<String>,
    status: Option<String>,
}

#[derive(Debug, Serialize)]
struct ExportResponse {
    path: String,
}

#[derive(Debug, Deserialize)]
struct WriteTagsArgs {
    scan_id: String,
    paths: Vec<String>,
}

#[derive(Debug, Serialize)]
struct WriteTagsResponse {
    written_count: usize,
    failed_count: usize,
    backup_path: String,
}

#[derive(Debug, Serialize)]
struct LatestScanResponse {
    summary: Option<ScanSummary>,
    tracks: Vec<TrackRow>,
}

#[derive(Debug, Deserialize)]
struct ScanArgs {
    root: String,
    limit: Option<usize>,
}

#[tauri::command]
fn choose_folder() -> Option<String> {
    rfd::FileDialog::new()
        .set_title("Choose a music library folder for Crate OS")
        .pick_folder()
        .map(|path| path.to_string_lossy().to_string())
}

#[tauri::command]
fn latest_scan(app: AppHandle) -> Result<LatestScanResponse, String> {
    let conn = open_database(&app)?;
    init_database(&conn)?;
    let summary = latest_summary(&conn)?;
    let tracks = if let Some(summary) = &summary {
        tracks_for_scan(&conn, &summary.scan_id)?
    } else {
        Vec::new()
    };
    Ok(LatestScanResponse { summary, tracks })
}

#[tauri::command]
fn export_latest_scan(app: AppHandle, args: ExportArgs) -> Result<ExportResponse, String> {
    if matches!(args.format.as_str(), "json" | "live365")
        && args.tier != "supporter"
        && args.tier != "pro"
    {
        return Err("Advanced exports require the supporter tier.".to_string());
    }

    let conn = open_database(&app)?;
    init_database(&conn)?;
    let summary =
        latest_summary(&conn)?.ok_or_else(|| "Scan a folder before exporting.".to_string())?;
    let tracks = filtered_export_tracks(tracks_for_scan(&conn, &summary.scan_id)?, &args);
    if tracks.is_empty() {
        return Err("No tracks match the current export scope.".to_string());
    }
    let export_dir = exports_dir(&app)?;
    fs::create_dir_all(&export_dir).map_err(|error| error.to_string())?;

    let stamp = Utc::now().format("%Y%m%d-%H%M%S");
    let scope = export_scope_slug(&args);
    let path = match args.format.as_str() {
        "json" => {
            let path = export_dir.join(format!("crate-os-{scope}-{stamp}.json"));
            let body = serde_json::to_string_pretty(&tracks).map_err(|error| error.to_string())?;
            fs::write(&path, body).map_err(|error| error.to_string())?;
            path
        }
        "live365" => {
            let path = export_dir.join(format!("crate-os-live365-{scope}-{stamp}.csv"));
            write_csv_export(&path, &tracks)?;
            path
        }
        "djprep" => {
            let path = export_dir.join(format!("crate-os-dj-prep-{scope}-{stamp}.csv"));
            write_dj_prep_export(&path, &tracks)?;
            path
        }
        "m3u" => {
            let path = export_dir.join(format!("crate-os-playlist-{scope}-{stamp}.m3u8"));
            write_m3u_export(&path, &tracks)?;
            path
        }
        _ => {
            let path = export_dir.join(format!("crate-os-library-{scope}-{stamp}.csv"));
            write_csv_export(&path, &tracks)?;
            path
        }
    };

    Ok(ExportResponse {
        path: path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn open_exports_folder(app: AppHandle) -> Result<(), String> {
    let export_dir = exports_dir(&app)?;
    fs::create_dir_all(&export_dir).map_err(|error| error.to_string())?;
    open_path(&export_dir)
}

#[tauri::command]
fn update_track_metadata(app: AppHandle, update: TrackMetadataUpdate) -> Result<(), String> {
    let conn = open_database(&app)?;
    init_database(&conn)?;
    conn.execute(
        "update tracks
         set title = ?1, artist = ?2, album = ?3, genre = ?4, year = ?5,
             proposed_bucket = ?6, live365_readiness = ?7,
             metadata_dirty = 1, tag_write_status = 'pending'
         where scan_id = ?8 and path = ?9",
        params![
            update.title,
            update.artist,
            update.album,
            update.genre,
            update.year,
            update.proposed_bucket,
            update.live365_readiness,
            update.scan_id,
            update.path,
        ],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn bulk_update_tracks(app: AppHandle, update: BulkMetadataUpdate) -> Result<(), String> {
    if update.paths.is_empty() {
        return Ok(());
    }

    let conn = open_database(&app)?;
    init_database(&conn)?;
    for path in update.paths {
        if let Some(value) = &update.artist {
            conn.execute(
                "update tracks set artist = ?1 where scan_id = ?2 and path = ?3",
                params![value, update.scan_id, path],
            )
            .map_err(|error| error.to_string())?;
        }
        if let Some(value) = &update.album {
            conn.execute(
                "update tracks set album = ?1 where scan_id = ?2 and path = ?3",
                params![value, update.scan_id, path],
            )
            .map_err(|error| error.to_string())?;
        }
        if let Some(value) = &update.genre {
            conn.execute(
                "update tracks set genre = ?1 where scan_id = ?2 and path = ?3",
                params![value, update.scan_id, path],
            )
            .map_err(|error| error.to_string())?;
        }
        if let Some(value) = &update.year {
            conn.execute(
                "update tracks set year = ?1 where scan_id = ?2 and path = ?3",
                params![value, update.scan_id, path],
            )
            .map_err(|error| error.to_string())?;
        }
        if let Some(value) = &update.proposed_bucket {
            conn.execute(
                "update tracks set proposed_bucket = ?1 where scan_id = ?2 and path = ?3",
                params![value, update.scan_id, path],
            )
            .map_err(|error| error.to_string())?;
        }
        if let Some(value) = &update.live365_readiness {
            conn.execute(
                "update tracks set live365_readiness = ?1 where scan_id = ?2 and path = ?3",
                params![value, update.scan_id, path],
            )
            .map_err(|error| error.to_string())?;
        }
        conn.execute(
            "update tracks set metadata_dirty = 1, tag_write_status = 'pending' where scan_id = ?1 and path = ?2",
            params![update.scan_id, path],
        )
        .map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn write_tags_to_files(app: AppHandle, args: WriteTagsArgs) -> Result<WriteTagsResponse, String> {
    if args.paths.is_empty() {
        return Err("Select tracks before writing tags.".to_string());
    }

    let conn = open_database(&app)?;
    init_database(&conn)?;
    let tracks = tracks_by_paths(&conn, &args.scan_id, &args.paths)?;
    if tracks.is_empty() {
        return Err("No selected tracks were found in the latest scan.".to_string());
    }

    let backup_path = write_tag_backup(&app, &tracks)?;
    let mut written_count = 0_usize;
    let mut failed_count = 0_usize;

    for track in tracks {
        if track.scan_status == "missing" {
            failed_count += 1;
            set_tag_write_status(&conn, &args.scan_id, &track.path, true, "failed_missing")?;
            continue;
        }

        match write_track_tags(&track) {
            Ok(()) => {
                written_count += 1;
                set_tag_write_status(&conn, &args.scan_id, &track.path, false, "written")?;
            }
            Err(_) => {
                failed_count += 1;
                set_tag_write_status(&conn, &args.scan_id, &track.path, true, "failed")?;
            }
        }
    }

    Ok(WriteTagsResponse {
        written_count,
        failed_count,
        backup_path: backup_path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
async fn scan_library(
    app: AppHandle,
    root: String,
    limit: Option<usize>,
) -> Result<ScanSummary, String> {
    let args = ScanArgs { root, limit };
    tauri::async_runtime::spawn_blocking(move || scan_library_blocking(app, args))
        .await
        .map_err(|error| error.to_string())?
}

fn scan_library_blocking(app: AppHandle, args: ScanArgs) -> Result<ScanSummary, String> {
    let root = PathBuf::from(&args.root);
    if !root.is_dir() {
        return Err("Choose an existing folder before scanning.".to_string());
    }

    let mut files = Vec::new();
    for entry in WalkDir::new(&root)
        .follow_links(false)
        .into_iter()
        .filter_map(Result::ok)
    {
        if !entry.file_type().is_file() {
            continue;
        }
        if is_audio_file(entry.path()) {
            files.push(entry.path().to_path_buf());
            if args.limit.is_some_and(|limit| files.len() >= limit) {
                break;
            }
        }
    }

    let total = files.len();
    let scan_id = Uuid::new_v4().to_string();
    let started_at = Utc::now().to_rfc3339();
    let mut tracks = Vec::new();
    let mut total_bytes = 0_i64;
    let conn = open_database(&app)?;
    init_database(&conn)?;
    let previous_tracks = latest_tracks_for_root(&conn, &args.root)?;
    let previous_by_path = previous_tracks
        .into_iter()
        .map(|track| (track.path.clone(), track))
        .collect::<HashMap<_, _>>();
    let mut current_paths = HashSet::new();

    for (index, file) in files.iter().enumerate() {
        let _ = app.emit(
            "scan-progress",
            ScanProgress {
                phase: "scanning".to_string(),
                current: index + 1,
                total,
                path: Some(file.to_string_lossy().to_string()),
            },
        );

        let metadata = fs::metadata(file).map_err(|error| error.to_string())?;
        let size = metadata.len() as i64;
        total_bytes += size;
        let mut track = track_from_path(&root, file, size);
        if let Some(previous) = previous_by_path.get(&track.path) {
            if previous.metadata_dirty {
                track.artist = previous.artist.clone();
                track.album = previous.album.clone();
                track.genre = previous.genre.clone();
                track.year = previous.year.clone();
                track.title = previous.title.clone();
                track.metadata_dirty = previous.metadata_dirty;
                track.tag_write_status = previous.tag_write_status.clone();
            } else {
                track.artist = fallback_text(&track.artist, &previous.artist);
                track.album = fallback_text(&track.album, &previous.album);
                track.genre = fallback_text(&track.genre, &previous.genre);
                track.year = fallback_text(&track.year, &previous.year);
                track.title = fallback_text(&track.title, &previous.title);
                track.tag_write_status = "synced".to_string();
            }
            track.proposed_bucket = previous.proposed_bucket.clone();
            track.live365_readiness = previous.live365_readiness.clone();
            track.scan_status = if previous.file_size_bytes != track.file_size_bytes {
                "changed".to_string()
            } else {
                "unchanged".to_string()
            };
        }
        current_paths.insert(track.path.clone());
        tracks.push(track);
    }

    for previous in previous_by_path.values() {
        if !current_paths.contains(&previous.path) {
            let mut missing = previous.clone();
            missing.scan_status = "missing".to_string();
            tracks.push(missing);
        }
    }

    let known_runtime_seconds = tracks
        .iter()
        .filter(|track| track.scan_status != "missing")
        .filter_map(|track| track.duration_seconds)
        .sum::<f64>();
    let unknown_runtime_count = tracks
        .iter()
        .filter(|track| track.scan_status != "missing")
        .filter(|track| track.duration_seconds.is_none())
        .count();

    save_scan(
        &conn,
        &scan_id,
        &args.root,
        &started_at,
        total_bytes,
        &tracks,
    )?;
    let summary = ScanSummary {
        scan_id,
        root: args.root,
        track_count: tracks.len(),
        total_bytes,
        known_runtime_seconds,
        unknown_runtime_count,
    };
    let _ = app.emit(
        "scan-progress",
        ScanProgress {
            phase: "saved".to_string(),
            current: tracks.len(),
            total: tracks.len(),
            path: None,
        },
    );
    Ok(summary)
}

fn track_from_path(root: &Path, file: &Path, size: i64) -> TrackRow {
    let filename = file
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_default();
    let extension = file
        .extension()
        .map(|ext| format!(".{}", ext.to_string_lossy().to_lowercase()))
        .unwrap_or_default();
    let file_stem_title = file
        .file_stem()
        .map(|stem| stem.to_string_lossy().to_string())
        .unwrap_or_else(|| filename.clone());
    let relative_folder = file
        .parent()
        .and_then(|parent| parent.strip_prefix(root).ok())
        .map(|folder| {
            let value = folder.to_string_lossy().to_string();
            if value.is_empty() {
                "(root)".to_string()
            } else {
                value
            }
        })
        .unwrap_or_else(|| "(root)".to_string());
    let audio_tags = audio_tags(file);
    let title = fallback_text(&audio_tags.title, &file_stem_title);
    let haystack = format!("{} {} {}", file.to_string_lossy(), filename, title).to_lowercase();
    let proposed_bucket = classify(&haystack);
    let live365_readiness = "metadata_review_before_upload".to_string();

    TrackRow {
        path: file.to_string_lossy().to_string(),
        relative_folder,
        filename,
        extension,
        file_size_bytes: size,
        title,
        artist: audio_tags.artist,
        album: audio_tags.album,
        genre: audio_tags.genre,
        year: audio_tags.year,
        duration_seconds: audio_duration_seconds(file),
        proposed_bucket,
        live365_readiness,
        scan_status: "new".to_string(),
        metadata_dirty: false,
        tag_write_status: "scanned".to_string(),
    }
}

#[derive(Default)]
struct AudioTags {
    title: String,
    artist: String,
    album: String,
    genre: String,
    year: String,
}

fn audio_tags(file: &Path) -> AudioTags {
    let Ok(tagged_file) = lofty::read_from_path(file) else {
        return AudioTags::default();
    };
    let Some(tag) = tagged_file
        .primary_tag()
        .or_else(|| tagged_file.first_tag())
    else {
        return AudioTags::default();
    };

    AudioTags {
        title: tag
            .title()
            .map(|value| value.into_owned())
            .unwrap_or_default(),
        artist: tag
            .artist()
            .map(|value| value.into_owned())
            .unwrap_or_default(),
        album: tag
            .album()
            .map(|value| value.into_owned())
            .unwrap_or_default(),
        genre: tag
            .genre()
            .map(|value| value.into_owned())
            .unwrap_or_default(),
        year: tag
            .year()
            .map(|value| value.to_string())
            .unwrap_or_default(),
    }
}

fn audio_duration_seconds(file: &Path) -> Option<f64> {
    let source = File::open(file).ok()?;
    let media_source = MediaSourceStream::new(Box::new(source), Default::default());
    let mut hint = Hint::new();
    if let Some(extension) = file.extension().and_then(|extension| extension.to_str()) {
        hint.with_extension(extension);
    }

    let probed = get_probe()
        .format(
            &hint,
            media_source,
            &FormatOptions::default(),
            &MetadataOptions::default(),
        )
        .ok()?;
    let mut format = probed.format;
    let track = format.default_track()?;
    let track_id = track.id;
    let time_base = track.codec_params.time_base?;

    if let Some(frame_count) = track.codec_params.n_frames {
        let duration = time_base.calc_time(frame_count);
        return Some(duration.seconds as f64 + duration.frac);
    }

    let mut last_timestamp = None;
    loop {
        match format.next_packet() {
            Ok(packet) if packet.track_id() == track_id => {
                last_timestamp = Some(packet.ts().saturating_add(packet.dur()));
            }
            Ok(_) => {}
            Err(SymphoniaError::IoError(_)) | Err(SymphoniaError::ResetRequired) => break,
            Err(_) => break,
        }
    }

    last_timestamp.map(|timestamp| {
        let duration = time_base.calc_time(timestamp);
        duration.seconds as f64 + duration.frac
    })
}

fn classify(haystack: &str) -> String {
    if ["mix", "podcast", "interview", "talk"]
        .iter()
        .any(|term| haystack.contains(term))
    {
        return "longform_radio".to_string();
    }
    if ["house", "club", "techno", "dance", "disco", "remix"]
        .iter()
        .any(|term| haystack.contains(term))
    {
        return "club_late_night".to_string();
    }
    if ["folk", "country", "americana", "reggae", "soul", "rock"]
        .iter()
        .any(|term| haystack.contains(term))
    {
        return "day_safe".to_string();
    }
    "day_safe_review".to_string()
}

fn is_audio_file(path: &Path) -> bool {
    path.extension()
        .map(|ext| ext.to_string_lossy().to_lowercase())
        .is_some_and(|ext| AUDIO_EXTENSIONS.contains(&ext.as_str()))
}

fn open_database(app: &AppHandle) -> Result<Connection, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&data_dir).map_err(|error| error.to_string())?;
    Connection::open(data_dir.join("crate-os.sqlite3")).map_err(|error| error.to_string())
}

fn exports_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("exports"))
}

fn init_database(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(include_str!("../migrations/001_init.sql"))
        .map_err(|error| error.to_string())?;
    let _ = conn.execute(
        "alter table tracks add column scan_status text not null default 'scanned'",
        [],
    );
    let _ = conn.execute(
        "alter table tracks add column metadata_dirty integer not null default 0",
        [],
    );
    let _ = conn.execute(
        "alter table tracks add column tag_write_status text not null default 'scanned'",
        [],
    );
    Ok(())
}

fn save_scan(
    conn: &Connection,
    scan_id: &str,
    root: &str,
    started_at: &str,
    total_bytes: i64,
    tracks: &[TrackRow],
) -> Result<(), String> {
    conn.execute(
        "insert into scans (id, root, started_at, track_count, total_bytes, known_runtime_seconds, unknown_runtime_count)
         values (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            scan_id,
            root,
            started_at,
            tracks.len() as i64,
            total_bytes,
            tracks
                .iter()
                .filter(|track| track.scan_status != "missing")
                .filter_map(|track| track.duration_seconds)
                .sum::<f64>(),
            tracks
                .iter()
                .filter(|track| track.scan_status != "missing")
                .filter(|track| track.duration_seconds.is_none())
                .count() as i64,
        ],
    )
    .map_err(|error| error.to_string())?;

    for track in tracks {
        conn.execute(
            "insert into tracks (
              scan_id, path, relative_folder, filename, extension, file_size_bytes,
              title, artist, album, genre, year, duration_seconds, proposed_bucket, live365_readiness,
              scan_status, metadata_dirty, tag_write_status
            ) values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
            params![
                scan_id,
                track.path,
                track.relative_folder,
                track.filename,
                track.extension,
                track.file_size_bytes,
                track.title,
                track.artist,
                track.album,
                track.genre,
                track.year,
                track.duration_seconds,
                track.proposed_bucket,
                track.live365_readiness,
                track.scan_status,
                track.metadata_dirty as i64,
                track.tag_write_status,
            ],
        )
        .map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn latest_tracks_for_root(conn: &Connection, root: &str) -> Result<Vec<TrackRow>, String> {
    let mut stmt = conn
        .prepare("select id from scans where root = ?1 order by started_at desc limit 1")
        .map_err(|error| error.to_string())?;
    let scan_id = stmt.query_row([root], |row| row.get::<_, String>(0)).ok();
    if let Some(scan_id) = scan_id {
        tracks_for_scan(conn, &scan_id)
    } else {
        Ok(Vec::new())
    }
}

fn latest_summary(conn: &Connection) -> Result<Option<ScanSummary>, String> {
    let mut stmt = conn
        .prepare(
            "select id, root, track_count, total_bytes, known_runtime_seconds, unknown_runtime_count
             from scans order by started_at desc limit 1",
        )
        .map_err(|error| error.to_string())?;
    let mut rows = stmt.query([]).map_err(|error| error.to_string())?;
    if let Some(row) = rows.next().map_err(|error| error.to_string())? {
        Ok(Some(ScanSummary {
            scan_id: row.get(0).map_err(|error| error.to_string())?,
            root: row.get(1).map_err(|error| error.to_string())?,
            track_count: row.get::<_, i64>(2).map_err(|error| error.to_string())? as usize,
            total_bytes: row.get(3).map_err(|error| error.to_string())?,
            known_runtime_seconds: row.get(4).map_err(|error| error.to_string())?,
            unknown_runtime_count: row.get::<_, i64>(5).map_err(|error| error.to_string())?
                as usize,
        }))
    } else {
        Ok(None)
    }
}

fn tracks_for_scan(conn: &Connection, scan_id: &str) -> Result<Vec<TrackRow>, String> {
    let mut stmt = conn
        .prepare(
            "select path, relative_folder, filename, extension, file_size_bytes, title, artist, album,
                    genre, year, duration_seconds, proposed_bucket, live365_readiness, scan_status,
                    metadata_dirty, tag_write_status
             from tracks where scan_id = ?1 order by relative_folder, filename",
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([scan_id], |row| {
            Ok(TrackRow {
                path: row.get(0)?,
                relative_folder: row.get(1)?,
                filename: row.get(2)?,
                extension: row.get(3)?,
                file_size_bytes: row.get(4)?,
                title: row.get(5)?,
                artist: row.get(6)?,
                album: row.get(7)?,
                genre: row.get(8)?,
                year: row.get(9)?,
                duration_seconds: row.get(10)?,
                proposed_bucket: row.get(11)?,
                live365_readiness: row.get(12)?,
                scan_status: row.get(13)?,
                metadata_dirty: row.get::<_, i64>(14)? != 0,
                tag_write_status: row.get(15)?,
            })
        })
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn tracks_by_paths(
    conn: &Connection,
    scan_id: &str,
    paths: &[String],
) -> Result<Vec<TrackRow>, String> {
    let all_tracks = tracks_for_scan(conn, scan_id)?;
    let selected = paths.iter().cloned().collect::<HashSet<_>>();
    Ok(all_tracks
        .into_iter()
        .filter(|track| selected.contains(&track.path))
        .collect())
}

fn set_tag_write_status(
    conn: &Connection,
    scan_id: &str,
    path: &str,
    dirty: bool,
    status: &str,
) -> Result<(), String> {
    conn.execute(
        "update tracks set metadata_dirty = ?1, tag_write_status = ?2 where scan_id = ?3 and path = ?4",
        params![dirty as i64, status, scan_id, path],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

fn write_tag_backup(app: &AppHandle, tracks: &[TrackRow]) -> Result<PathBuf, String> {
    let backup_dir = exports_dir(app)?.join("tag-backups");
    fs::create_dir_all(&backup_dir).map_err(|error| error.to_string())?;
    let stamp = Utc::now().format("%Y%m%d-%H%M%S");
    let backup_path = backup_dir.join(format!("crate-os-tag-backup-{stamp}.json"));
    let body = serde_json::to_string_pretty(tracks).map_err(|error| error.to_string())?;
    fs::write(&backup_path, body).map_err(|error| error.to_string())?;
    Ok(backup_path)
}

fn write_track_tags(track: &TrackRow) -> Result<(), String> {
    let path = Path::new(&track.path);
    let mut tagged_file = lofty::read_from_path(path).map_err(|error| error.to_string())?;
    let tag_type = tagged_file.primary_tag_type();
    if tagged_file.primary_tag_mut().is_none() {
        tagged_file.insert_tag(Tag::new(tag_type));
    }

    let tag = tagged_file
        .primary_tag_mut()
        .ok_or_else(|| "File does not support writable tags.".to_string())?;
    if track.title.trim().is_empty() {
        tag.remove_title();
    } else {
        tag.set_title(track.title.trim().to_string());
    }
    if track.artist.trim().is_empty() {
        tag.remove_artist();
    } else {
        tag.set_artist(track.artist.trim().to_string());
    }
    if track.album.trim().is_empty() {
        tag.remove_album();
    } else {
        tag.set_album(track.album.trim().to_string());
    }
    if track.genre.trim().is_empty() {
        tag.remove_genre();
    } else {
        tag.set_genre(track.genre.trim().to_string());
    }
    if let Ok(year) = track.year.trim().parse::<u32>() {
        tag.set_year(year);
    } else if track.year.trim().is_empty() {
        tag.remove_year();
    }

    tagged_file
        .save_to_path(path, WriteOptions::default())
        .map_err(|error| error.to_string())
}

fn fallback_text(value: &str, fallback: &str) -> String {
    if value.trim().is_empty() {
        fallback.to_string()
    } else {
        value.to_string()
    }
}

fn write_csv_export(path: &Path, tracks: &[TrackRow]) -> Result<(), String> {
    let mut file = File::create(path).map_err(|error| error.to_string())?;
    writeln!(
        file,
        "artist,title,album,genre,year,duration_seconds,bucket,readiness,status,path"
    )
    .map_err(|error| error.to_string())?;
    for track in tracks {
        writeln!(
            file,
            "{},{},{},{},{},{},{},{},{},{}",
            csv_field(&track.artist),
            csv_field(&track.title),
            csv_field(&track.album),
            csv_field(&track.genre),
            csv_field(&track.year),
            track
                .duration_seconds
                .map(|value| value.to_string())
                .unwrap_or_default(),
            csv_field(&track.proposed_bucket),
            csv_field(&track.live365_readiness),
            csv_field(&track.scan_status),
            csv_field(&track.path),
        )
        .map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn write_dj_prep_export(path: &Path, tracks: &[TrackRow]) -> Result<(), String> {
    let mut file = File::create(path).map_err(|error| error.to_string())?;
    writeln!(
        file,
        "artist,title,album,genre,year,duration,location,comments,crate,readiness,status"
    )
    .map_err(|error| error.to_string())?;
    for track in tracks.iter().filter(|track| track.scan_status != "missing") {
        writeln!(
            file,
            "{},{},{},{},{},{},{},{},{},{},{}",
            csv_field(&track.artist),
            csv_field(&track.title),
            csv_field(&track.album),
            csv_field(&track.genre),
            csv_field(&track.year),
            csv_field(&format_duration_colon(track.duration_seconds)),
            csv_field(&track.path),
            csv_field(&format!("{} | {}", track.proposed_bucket, track.filename)),
            csv_field(&track.relative_folder),
            csv_field(&track.live365_readiness),
            csv_field(&track.scan_status),
        )
        .map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn write_m3u_export(path: &Path, tracks: &[TrackRow]) -> Result<(), String> {
    let mut file = File::create(path).map_err(|error| error.to_string())?;
    writeln!(file, "#EXTM3U").map_err(|error| error.to_string())?;
    for track in tracks.iter().filter(|track| track.scan_status != "missing") {
        let duration = track
            .duration_seconds
            .map(|value| value.round() as i64)
            .unwrap_or(-1);
        let artist = if track.artist.trim().is_empty() {
            "Unknown Artist"
        } else {
            track.artist.as_str()
        };
        let title = if track.title.trim().is_empty() {
            track.filename.as_str()
        } else {
            track.title.as_str()
        };
        writeln!(file, "#EXTINF:{duration},{artist} - {title}")
            .map_err(|error| error.to_string())?;
        writeln!(file, "{}", track.path).map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn filtered_export_tracks(tracks: Vec<TrackRow>, args: &ExportArgs) -> Vec<TrackRow> {
    let selected_paths = args
        .paths
        .as_ref()
        .map(|paths| paths.iter().cloned().collect::<HashSet<_>>())
        .unwrap_or_default();
    let folder_filter = args
        .folder
        .as_ref()
        .filter(|folder| !folder.is_empty() && folder.as_str() != "all");
    let status_filter = args
        .status
        .as_ref()
        .filter(|status| !status.is_empty() && status.as_str() != "all");

    tracks
        .into_iter()
        .filter(|track| {
            if selected_paths.is_empty() {
                true
            } else {
                selected_paths.contains(&track.path)
            }
        })
        .filter(|track| {
            if selected_paths.is_empty() {
                folder_filter.is_none_or(|folder| track.relative_folder == *folder)
            } else {
                true
            }
        })
        .filter(|track| status_filter.is_none_or(|status| track.scan_status == *status))
        .collect()
}

fn export_scope_slug(args: &ExportArgs) -> String {
    if args.paths.as_ref().is_some_and(|paths| !paths.is_empty()) {
        return "selected".to_string();
    }
    args.folder
        .as_ref()
        .filter(|folder| !folder.is_empty() && folder.as_str() != "all")
        .map(|folder| slugify(folder))
        .unwrap_or_else(|| "latest".to_string())
}

fn slugify(value: &str) -> String {
    let mut slug = value
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() {
                ch.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect::<String>();
    while slug.contains("--") {
        slug = slug.replace("--", "-");
    }
    slug.trim_matches('-').chars().take(48).collect::<String>()
}

fn csv_field(value: &str) -> String {
    format!("\"{}\"", value.replace('"', "\"\""))
}

fn format_duration_colon(seconds: Option<f64>) -> String {
    let Some(seconds) = seconds else {
        return String::new();
    };
    let rounded = seconds.round() as i64;
    let hours = rounded / 3600;
    let minutes = (rounded % 3600) / 60;
    let secs = rounded % 60;
    if hours > 0 {
        format!("{hours}:{minutes:02}:{secs:02}")
    } else {
        format!("{minutes}:{secs:02}")
    }
}

fn open_path(path: &Path) -> Result<(), String> {
    let status = if cfg!(target_os = "macos") {
        Command::new("open").arg(path).status()
    } else if cfg!(target_os = "windows") {
        Command::new("explorer").arg(path).status()
    } else {
        Command::new("xdg-open").arg(path).status()
    }
    .map_err(|error| error.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err("Could not open exports folder.".to_string())
    }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            choose_folder,
            latest_scan,
            scan_library,
            update_track_metadata,
            bulk_update_tracks,
            export_latest_scan,
            open_exports_folder,
            write_tags_to_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running Crate OS");
}
