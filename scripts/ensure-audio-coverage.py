#!/usr/bin/env python3
"""Ensure every visible AudioButton text has an on-disk MP3.

Run only when adding/editing course content. Audio is synthetic eSpeak sr;
technical validity does NOT establish correct pronunciation or redistribution rights.
"""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile
import re

ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / 'src/content/catalog.json').read_text(encoding='utf-8'))
STUDY = json.loads((ROOT / 'src/content/study-program-v3.json').read_text(encoding='utf-8'))
INDEX_PATH = ROOT / 'src/content/audio-index.json'
MANIFEST_PATH = ROOT / 'public/audio/manifest.json'
INDEX: dict[str, str] = json.loads(INDEX_PATH.read_text(encoding='utf-8'))
MANIFEST = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
OUTPUT = ROOT / 'public/audio'


def clean(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


def canonical(text: str) -> str:
    return clean(text).casefold()


def all_playback_texts() -> set[str]:
    texts: set[str] = set()

    def add(text: str | None) -> None:
        if text and clean(text):
            texts.add(clean(text))

    for word in CATALOG['dictionary']:
        add(word.get('sr'))
        add(word.get('usage'))
    for lesson in CATALOG['lessons']:
        for word in lesson.get('vocab', []):
            add(word.get('sr'))
            add(word.get('usage'))
        for example in lesson.get('examples', []):
            add(example.get('sr'))
        for turn in lesson.get('dialogue', []):
            add(turn.get('sr'))
        if lesson.get('addon'):
            for sr, _ru in lesson['addon'][2]:
                add(sr)
    for unit in STUDY:
        for word in unit['words']:
            add(word.get('sr'))
            add(word.get('usage'))
        for turn in unit['dialogue']['turns']:
            add(turn.get('sr'))
        add(unit['listening'].get('sr'))
    # Explicitly rendered in the Settings audio-test button.
    add('Dobar dan!')
    return texts


def generate_mp3(text: str) -> tuple[str, str]:
    audio_id = hashlib.sha256(text.encode('utf-8')).hexdigest()[:20]
    path = OUTPUT / f'{audio_id}.mp3'
    if not path.is_file() or path.stat().st_size < 500:
        with tempfile.TemporaryDirectory() as tmp:
            wave = Path(tmp) / 'speech.wav'
            # Readable pause at slashes instead of pronouncing punctuation.
            spoken = re.sub(r'\s*/\s*', '. ', text).replace('…', ' ')
            synth = subprocess.run(
                ['espeak', '-v', 'sr', '-s', '135', '-w', str(wave), spoken],
                capture_output=True, timeout=30,
            )
            if synth.returncode:
                raise RuntimeError(f'eSpeak failed for {text!r}: {synth.stderr[:300]!r}')
            encoded = subprocess.run(
                ['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-i', str(wave),
                 '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '48k', str(path)],
                capture_output=True, timeout=35,
            )
            if encoded.returncode:
                raise RuntimeError(f'ffmpeg failed for {text!r}: {encoded.stderr[:300]!r}')
    probe = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
         '-of', 'default=noprint_wrappers=1:nokey=1', str(path)],
        capture_output=True, text=True, timeout=15,
    )
    if probe.returncode or float(probe.stdout.strip() or 0) < 0.12:
        raise RuntimeError(f'Invalid MP3 audio for {text!r} at {path}')
    return text, audio_id


def main() -> None:
    texts = all_playback_texts()
    canon = {canonical(text): audio_id for text, audio_id in INDEX.items()}
    aliases = 0
    missing = []
    for text in sorted(texts):
        if text in INDEX:
            continue
        match = canon.get(canonical(text))
        if match:
            INDEX[text] = match
            aliases += 1
        else:
            missing.append(text)
    print(f'AudioButton texts: {len(texts)}; canonical aliases: {aliases}; new audio files: {len(missing)}', flush=True)
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(generate_mp3, text): text for text in missing}
        for future in as_completed(futures):
            text, audio_id = future.result()
            INDEX[text] = audio_id
            MANIFEST['entries'][audio_id] = {
                'text': text,
                'url': f'/audio/{audio_id}.mp3',
                'contentVersion': 3,
                'reviewStatus': 'unreviewed',
                'provider': 'eSpeak-sr',
                'licenseReview': 'pending_before_public_distribution',
            }
    INDEX_PATH.write_text(json.dumps(INDEX, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    MANIFEST_PATH.write_text(json.dumps(MANIFEST, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Audio index: {len(INDEX)}; MP3 files: {len(list(OUTPUT.glob("*.mp3")))}', flush=True)


if __name__ == '__main__':
    main()
