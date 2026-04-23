export type Track = {
  id: string;
  name: string;
  duration: number;
  audioUrl: string;
  artist?: string;
  image?: string;
  language?: string;
};

export type Album = {
  id: string;
  name: string;
  artist: string;
  image: string;
  songs: Track[];
};
