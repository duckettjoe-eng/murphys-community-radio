use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::File;
use std::path::{Path, PathBuf};
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
async fn scan_library(app: AppHandle, root: String, limit: Option<usize>) -> Result<ScanSummary, String> {
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
    for entry in WalkDir::new(&root).follow_links(false).into_iter().filter_map(Result::ok) {
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
        tracks.push(track_from_path(&root, file, size));
    }

    let known_runtime_seconds = tracks
        .iter()
        .filter_map(|track| track.duration_seconds)
        .sum::<f64>();
    let unknown_runtime_count = tracks
        .iter()
        .filter(|track| track.duration_seconds.is_none())
        .count();

    let conn = open_database(&app)?;
    init_database(&conn)?;
    save_scan(&conn, &scan_id, &args.root, &started_at, total_bytes, &tracks)?;
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
    let title = file
        .file_stem()
        .map(|stem| stem.to_string_lossy().to_string())
        .unwrap_or_else(|| filename.clone());
    let relative_folder = file
        .parent()
        .and_then(|parent| parent.strip_prefix(root).ok())
        .map(|folder| {
            let value = folder.to_string_lossy().to_string();
            if value.is_empty() { "(root)".to_string() } else { value }
        })
        .unwrap_or_else(|| "(root)".to_string());
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
        artist: String::new(),
        album: String::new(),
        genre: String::new(),
        year: String::new(),
        duration_seconds: audio_duration_seconds(file),
        proposed_bucket,
        live365_readiness,
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
    if ["mix", "podcast", "interview", "talk"].iter().any(|term| haystack.contains(term)) {
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

fn init_database(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(include_str!("../migrations/001_init.sql"))
        .map_err(|error| error.to_string())
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
            tracks.iter().filter_map(|track| track.duration_seconds).sum::<f64>(),
            tracks.iter().filter(|track| track.duration_seconds.is_none()).count() as i64,
        ],
    )
    .map_err(|error| error.to_string())?;

    for track in tracks {
        conn.execute(
            "insert into tracks (
              scan_id, path, relative_folder, filename, extension, file_size_bytes,
              title, artist, album, genre, year, duration_seconds, proposed_bucket, live365_readiness
            ) values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
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
            ],
        )
        .map_err(|error| error.to_string())?;
    }
    Ok(())
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
            unknown_runtime_count: row.get::<_, i64>(5).map_err(|error| error.to_string())? as usize,
        }))
    } else {
        Ok(None)
    }
}

fn tracks_for_scan(conn: &Connection, scan_id: &str) -> Result<Vec<TrackRow>, String> {
    let mut stmt = conn
        .prepare(
            "select path, relative_folder, filename, extension, file_size_bytes, title, artist, album,
                    genre, year, duration_seconds, proposed_bucket, live365_readiness
             from tracks where scan_id = ?1 order by relative_folder, filename limit 500",
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
            })
        })
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            choose_folder,
            latest_scan,
            scan_library
        ])
        .run(tauri::generate_context!())
        .expect("error while running Crate OS");
}
