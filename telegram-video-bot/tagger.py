"""
Generates descriptive tags for a video from its caption, channel name,
file name, and resolution.  No external NLP libraries required.
"""

import re
from pathlib import Path

# Words too common or uninformative to keep as tags
_STOPWORDS: frozenset[str] = frozenset(
    {
        # articles / prepositions
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
        "for", "of", "with", "by", "from", "as", "into", "through",
        # verbs
        "is", "are", "was", "were", "be", "been", "being", "have",
        "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "must", "can", "get", "got",
        # pronouns
        "this", "that", "these", "those", "it", "its", "i", "you",
        "he", "she", "we", "they", "my", "your", "his", "her", "our",
        "their", "me", "him", "us", "them",
        # question words
        "what", "which", "who", "whom", "when", "where", "why", "how",
        # quantifiers
        "all", "any", "both", "each", "few", "more", "most", "other",
        "some", "such", "no", "nor", "not", "only", "own", "same",
        "so", "than", "too", "very",
        # contractions / fragments
        "s", "t", "d", "ll", "m", "o", "re", "ve", "y",
        # Telegram / video jargon that adds no signal
        "video", "watch", "full", "hd", "uhd", "quality", "download",
        "free", "link", "channel", "telegram", "group", "join",
        "like", "share", "subscribe", "new", "latest", "best", "top",
        "official", "original", "clip", "part", "episode", "ep",
        "season", "series", "movie", "film", "trailer", "teaser",
        "preview", "stream", "online", "here", "now", "today",
        "please", "dont", "just", "also", "via", "per", "vs",
    }
)

# Regex patterns
_URL_RE        = re.compile(r"https?://\S+|www\.\S+")
_HASHTAG_RE    = re.compile(r"#(\w+)")
_MENTION_RE    = re.compile(r"@\w+")
_NON_ALNUM_RE  = re.compile(r"[^a-z0-9 ]")
_MULTI_SPACE   = re.compile(r"\s+")


def classify_resolution(width: int, height: int) -> str | None:
    """Return '4K', '1080p', or None if below threshold."""
    long_side = max(width, height)
    short_side = min(width, height)
    if long_side >= 3840 or short_side >= 2160:
        return "4K"
    if long_side >= 1920 or short_side >= 1080:
        return "1080p"
    return None


# Aspect ratio labels stored in the DB and used as filter tokens.
ASPECT_LABELS = ("portrait", "square", "standard", "widescreen", "ultrawide")


def classify_aspect_ratio(width: int, height: int) -> str | None:
    """
    Classify the frame geometry into one of five named buckets:

      portrait   — height > width  (9:16, vertical video)
      square     — ratio ≈ 1:1     (Instagram-style)
      standard   — ratio 1.1–1.6   (4:3, 3:2, 5:4 …)
      widescreen — ratio 1.6–2.1   (16:9, 16:10 …)
      ultrawide  — ratio > 2.1     (21:9, 2.35:1 cinema …)

    Returns None when either dimension is 0.
    """
    if not width or not height:
        return None
    ratio = width / height
    if ratio < 0.95:
        return "portrait"
    if ratio <= 1.15:
        return "square"
    if ratio <= 1.60:
        return "standard"
    if ratio <= 2.10:
        return "widescreen"
    return "ultrawide"


# Duration bucket boundaries in seconds
_DUR_SHORT  = 120    # < 2 min
_DUR_MEDIUM = 1200   # < 20 min


def classify_duration(seconds: int) -> str:
    """Return 'short', 'medium', or 'long'."""
    if seconds < _DUR_SHORT:
        return "short"
    if seconds < _DUR_MEDIUM:
        return "medium"
    return "long"


def extract_tags(
    caption: str = "",
    channel_name: str = "",
    file_name: str = "",
    resolution: str = "",
    duration: int = 0,
    width: int = 0,
    height: int = 0,
) -> list[str]:
    """
    Build a de-duplicated, sorted tag list from all available context.
    Tags are lowercased; multi-word concepts become underscore_joined.
    """
    tags: set[str] = set()

    # 1. Resolution
    if resolution:
        tags.add(resolution.lower())

    # 2. Duration bucket
    if duration:
        tags.add(classify_duration(duration))

    # 3. Aspect ratio
    ar = classify_aspect_ratio(width, height)
    if ar:
        tags.add(ar)

    # 4. Channel / group name
    if channel_name:
        slug = _slugify(channel_name)
        if slug:
            tags.add(f"src_{slug}")
        # also add individual words from channel name
        tags.update(_keywords_from(channel_name, max_words=5))

    # 5. Caption text
    if caption:
        # Explicit hashtags carry the author's own intent — high value
        for ht in _HASHTAG_RE.findall(caption):
            clean = ht.lower().strip()
            if len(clean) >= 2 and clean not in _STOPWORDS:
                tags.add(clean)
        tags.update(_keywords_from(caption, max_words=30, bigrams=True))

    # 6. File name (stem only)
    if file_name:
        stem = Path(file_name).stem
        tags.update(_keywords_from(stem, max_words=15))

    # Filter: min 2 chars, not a bare number
    return sorted(t for t in tags if len(t) >= 2 and not t.isdigit())


# ------------------------------------------------------------------
# Internal helpers
# ------------------------------------------------------------------

def _slugify(text: str) -> str:
    """Convert a name to a compact slug: 'My Cool Channel' → 'my_cool_channel'."""
    text = text.lower()
    text = _NON_ALNUM_RE.sub(" ", text)
    text = _MULTI_SPACE.sub(" ", text).strip()
    return text.replace(" ", "_")[:40]


def _keywords_from(
    text: str,
    max_words: int = 20,
    bigrams: bool = False,
) -> list[str]:
    """Extract significant single-word (and optionally bigram) keywords."""
    text = _URL_RE.sub(" ", text)
    text = _MENTION_RE.sub(" ", text)
    text = _HASHTAG_RE.sub(" ", text)  # already handled separately when needed
    text = text.lower()
    text = _NON_ALNUM_RE.sub(" ", text)
    text = _MULTI_SPACE.sub(" ", text).strip()

    words = [
        w for w in text.split()
        if w not in _STOPWORDS and len(w) >= 3 and not w.isdigit()
    ][:max_words]

    result = list(words)

    if bigrams and len(words) >= 2:
        for i in range(len(words) - 1):
            result.append(f"{words[i]}_{words[i + 1]}")

    return result
