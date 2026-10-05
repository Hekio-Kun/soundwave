export const MAX_AUDIO_SIZE = 30 * 1024 * 1024;
export const MAX_COVER_SIZE = 5 * 1024 * 1024;
export const MAX_LYRICS_SIZE = 1024 * 1024;

const AUDIO_EXTENSIONS = ["mp3", "wav", "flac"];
const COVER_EXTENSIONS = ["jpg", "jpeg", "png"];
const LYRICS_EXTENSIONS = ["lrc", "txt"];

function hasAllowedExtension(file: File, allowedExtensions: string[]) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(extension && allowedExtensions.includes(extension));
}

export function validateAudioFile(file: File) {
  if (file.size > MAX_AUDIO_SIZE) return "Audio file must be smaller than 30MB.";
  if (!hasAllowedExtension(file, AUDIO_EXTENSIONS)) return "Choose an MP3, WAV or FLAC audio file.";
  return "";
}

export function validateCoverFile(file: File) {
  if (file.size > MAX_COVER_SIZE) return "Cover artwork must be smaller than 5MB.";
  if (!hasAllowedExtension(file, COVER_EXTENSIONS)) return "Choose a JPG or PNG cover image.";
  return "";
}

export function validateLyricsFile(file: File) {
  if (file.size > MAX_LYRICS_SIZE) return "Lyrics file must be smaller than 1MB.";
  if (!hasAllowedExtension(file, LYRICS_EXTENSIONS)) return "Choose an LRC or TXT lyrics file.";
  return "";
}

export function readAudioDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(file);
    const finish = (duration?: number) => {
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? Math.round(audio.duration * 1000) : undefined);
    audio.onerror = () => finish();
    audio.src = objectUrl;
  });
}

export function readLyricsFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") resolve(content);
      else reject(new Error("Lyrics file could not be read."));
    };
    reader.onerror = () => reject(new Error("Lyrics file could not be read."));
    reader.readAsText(file);
  });
}
