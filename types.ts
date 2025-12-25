
export interface SongAttributes {
  title: string;
  artist: string;
  genre: string;
  lyrics: string;
}

export enum AppSection {
  HYPE_SESSION = 'HYPE_SESSION',
  ALBUM_GENERATOR = 'ALBUM_GENERATOR',
  VEO_STUDIO = 'VEO_STUDIO',
  MEDIA_ANALYZER = 'MEDIA_ANALYZER',
  IMAGE_EDITOR = 'IMAGE_EDITOR'
}

export interface TranscriptionItem {
  speaker: 'User' | 'Trump';
  text: string;
  timestamp: number;
}
