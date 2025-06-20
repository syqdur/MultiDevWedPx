// Spotify API type definitions
export namespace SpotifyApi {
  export interface PlaylistTrackObject {
    added_at: string;
    added_by: {
      id: string;
      display_name: string;
    };
    is_local: boolean;
    track: TrackObjectFull;
  }

  export interface TrackObjectFull {
    id: string;
    name: string;
    artists: ArtistObjectSimplified[];
    album: AlbumObjectSimplified;
    duration_ms: number;
    explicit: boolean;
    external_urls: ExternalUrlObject;
    href: string;
    is_playable: boolean;
    preview_url: string | null;
    track_number: number;
    type: "track";
    uri: string;
    is_local: boolean;
  }

  export interface ArtistObjectSimplified {
    id: string;
    name: string;
    type: "artist";
    uri: string;
    href: string;
    external_urls: ExternalUrlObject;
  }

  export interface AlbumObjectSimplified {
    id: string;
    name: string;
    images: ImageObject[];
    release_date: string;
    total_tracks: number;
    type: "album";
    uri: string;
  }

  export interface ImageObject {
    height: number | null;
    url: string;
    width: number | null;
  }

  export interface ExternalUrlObject {
    spotify: string;
  }

  export interface SearchResponse {
    tracks: {
      items: TrackObjectFull[];
      total: number;
      limit: number;
      offset: number;
    };
  }

  export interface UserObjectPrivate {
    id: string;
    display_name: string;
    email: string;
    images: ImageObject[];
  }

  export interface CurrentUsersProfileResponse extends UserObjectPrivate {
    country: string;
    explicit_content: {
      filter_enabled: boolean;
      filter_locked: boolean;
    };
    external_urls: ExternalUrlObject;
    followers: {
      href: string | null;
      total: number;
    };
    href: string;
    product: string;
    type: "user";
    uri: string;
  }

  export interface PlaylistObjectSimplified {
    id: string;
    name: string;
    description: string | null;
    external_urls: ExternalUrlObject;
    href: string;
    images: ImageObject[];
    owner: UserObjectPrivate;
    public: boolean | null;
    snapshot_id: string;
    tracks: {
      href: string;
      total: number;
    };
    type: "playlist";
    uri: string;
  }
}