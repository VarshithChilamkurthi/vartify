import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import { fetchSaavn } from "@/lib/server/saavnHttp";
import { decodeHtmlEntities } from "@/lib/server/utils";
import type { Track } from "@/lib/types/music";

type LinkObject = {
  quality?: string;
  link?: string;
  url?: string;
};

function getSearchItems(payload: unknown): unknown[] {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const data =
    typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : null;

  if (!data) {
    return [];
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (typeof data.songs === "object" && data.songs !== null) {
    const songs = data.songs as Record<string, unknown>;
    if (Array.isArray(songs.results)) {
      return songs.results;
    }
  }

  return [];
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function extractBestImageUrl(image: unknown): string {
  if (!Array.isArray(image)) {
    return "";
  }
  const links = image.filter((item): item is LinkObject => {
    return typeof item === "object" && item !== null;
  });
  if (!links.length) {
    return "";
  }
  const sorted = [...links].sort((a, b) => {
    return toNumber(b.quality) - toNumber(a.quality);
  });
  for (const entry of sorted) {
    const candidate = entry.link ?? entry.url;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  return "";
}

function extractArtist(item: Record<string, unknown>): string {
  if (typeof item.primaryArtists === "string" && item.primaryArtists.trim()) {
    return decodeHtmlEntities(item.primaryArtists);
  }

  const artists = item.artists as { primary?: Array<{ name?: string }> } | undefined;
  if (Array.isArray(artists?.primary) && artists.primary.length) {
    return artists.primary
      .map((a) => a.name)
      .filter((name): name is string => Boolean(name))
      .join(", ");
  }

  return "Unknown Artist";
}

function mapSongSearchItemToTrack(item: unknown): Track | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const raw = item as Record<string, unknown>;
  if (typeof raw.id !== "string" || !raw.id.trim()) {
    return null;
  }

  const downloadUrl = Array.isArray(raw.downloadUrl) ? raw.downloadUrl : [];
  const lastDownload = downloadUrl[downloadUrl.length - 1] as { url?: string } | undefined;

  const lang =
    typeof raw.language === "string" && raw.language.trim() ? raw.language.trim() : undefined;

  return {
    id: raw.id,
    name: decodeHtmlEntities(String(raw.name || "")),
    duration: typeof raw.duration === "number" ? raw.duration : Number(raw.duration) || 0,
    audioUrl: lastDownload?.url || "",
    artist: extractArtist(raw),
    image: extractBestImageUrl(raw.image),
    ...(lang ? { language: lang } : {}),
  };
}

function normalizeHistoryIds(value: unknown): Set<string> {
  if (!Array.isArray(value)) {
    return new Set();
  }
  return new Set(
    value.filter((id): id is string => typeof id === "string" && id.length > 0)
  );
}

const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { seedTrack?: unknown; historyIds?: unknown };
    const { seedTrack, historyIds } = body;

    if (!seedTrack || typeof seedTrack !== "object") {
      return NextResponse.json({ songs: [] as Track[] });
    }

    const st = seedTrack as { name?: unknown; artist?: unknown; language?: unknown };
    const seedName = typeof st.name === "string" ? st.name : String(st.name ?? "");
    const seedArtist = typeof st.artist === "string" ? st.artist : String(st.artist ?? "");
    const seedLanguage =
      typeof st.language === "string" && st.language.trim() ? st.language.trim() : "";

    const historySet = normalizeHistoryIds(historyIds);
    let searchQueries: string[] = [];

    // 1. ATTEMPT AI GENERATION
    if (process.env.GEMINI_API_KEY && seedName) {
      const langConstraint = seedLanguage
        ? `The recommended songs MUST strictly be in the ${seedLanguage} language.`
        : `Identify the primary language of the seed track and ensure all recommendations are STRICTLY in that exact same language.`;
      const prompt = `You are an expert music DJ. The user just listened to '${seedName}' by '${seedArtist}'. ${langConstraint} Generate an array of 5 highly specific search queries to find similar, vibe-matching songs. DO NOT return the exact same song. Return ONLY a JSON array of 5 strings.`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash", // The current stable free-tier model
          contents: prompt,
        });

        if (response.text) {
          const cleanText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanText);
          if (Array.isArray(parsed)) {
            searchQueries = parsed.map((q) => String(q).trim()).filter(Boolean).slice(0, 5);
          }
        }
      } catch (aiErr) {
        console.error("AI generation crashed:", aiErr);
      }
    }

    // 2. STAGE 1 FALLBACK
    if (searchQueries.length === 0) {
      const fallback = seedLanguage
        ? `${seedArtist} ${seedLanguage}`.trim()
        : seedArtist.trim() || seedName.trim() || "music";
      searchQueries = [fallback];
    }

    // 3. FETCH SONGS FROM JIOSAAVN
    // If we only have 1 query (Fallback), fetch 30 songs to survive deduplication. If AI (5 queries), fetch 2 per query.
    const fetchLimit = searchQueries.length === 1 ? 30 : 2;

    const outcomes = await Promise.allSettled(
      searchQueries.map((query) =>
        fetchSaavn(`/search/songs?query=${encodeURIComponent(query)}&limit=${fetchLimit}&page=0`)
      )
    );

    const processOutcomes = (results: PromiseSettledResult<unknown>[]) => {
      const tracks: Track[] = [];
      for (const outcome of results) {
        if (outcome.status !== "fulfilled") continue;
        const items = getSearchItems(outcome.value);
        for (const item of items) {
          const track = mapSongSearchItemToTrack(item);
          if (track) tracks.push(track);
        }
      }
      return tracks;
    };

    let tracks = processOutcomes(outcomes);

    // 4. DEDUPLICATION
    const seen = new Set<string>();
    let deduplicatedTracks = tracks.filter((t) => {
      if (historySet.has(t.id) || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    // 5. STAGE 2 FALLBACK (The Anti-Empty Trap)
    // If deduplication wiped out all our songs (e.g., user already listened to the artist's top 30), fetch general hits.
    if (deduplicatedTracks.length === 0) {
      console.log("Deduplication trap triggered. Fetching emergency fallback.");
      const emergencyQuery = seedLanguage
        ? `top ${seedLanguage} hits`
        : seedArtist.trim()
          ? `${seedArtist} hits`
          : "top charts";
      const emergencyRes = await fetchSaavn(
        `/search/songs?query=${encodeURIComponent(emergencyQuery)}&limit=15&page=1`
      );
      const emergencyItems = getSearchItems(emergencyRes);
      for (const item of emergencyItems) {
        const track = mapSongSearchItemToTrack(item);
        if (track && !historySet.has(track.id) && !seen.has(track.id)) {
          seen.add(track.id);
          deduplicatedTracks.push(track);
        }
      }
    }

    // Return the final survivor tracks
    return NextResponse.json({ songs: deduplicatedTracks });
  } catch (err) {
    console.error("Radio API critical failure:", err);
    return NextResponse.json({ songs: [] as Track[] });
  }
}
