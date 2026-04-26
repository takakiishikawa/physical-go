/**
 * Extract evenly-spaced JPEG frames from a video File using a hidden <video> + canvas.
 * Returns base64 data URLs suitable for sending as Anthropic image blocks.
 *
 * Long-edge target keeps payload small while staying well within Opus 4.7's
 * 2576px high-res limit. JPEG quality 0.85 balances file size and detail
 * needed for fine joint-angle observation.
 */
export async function extractFramesFromVideo(
  file: File,
  options: { count?: number; longEdge?: number; quality?: number } = {},
): Promise<string[]> {
  const count = options.count ?? 6;
  const longEdge = options.longEdge ?? 1280;
  const quality = options.quality ?? 0.85;

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  // crossOrigin not needed — blob URL is same-origin

  try {
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
        reject(new Error("動画の読み込みに失敗しました"));
      };
      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("error", onError);
    });

    const duration = isFinite(video.duration) ? video.duration : 0;
    if (duration <= 0) {
      throw new Error("動画の長さを取得できませんでした");
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    const scale = Math.min(1, longEdge / Math.max(w, h));
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context が取得できません");

    // Sample inside (5%, 95%) of duration to skip black frames at edges.
    const start = duration * 0.05;
    const end = duration * 0.95;
    const step = (end - start) / Math.max(1, count - 1);
    const timestamps = Array.from(
      { length: count },
      (_, i) => start + step * i,
    );

    const frames: string[] = [];
    for (const t of timestamps) {
      await seekTo(video, Math.min(t, duration - 0.05));
      ctx.drawImage(video, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      frames.push(dataUrl);
    }
    return frames;
  } finally {
    URL.revokeObjectURL(url);
    video.src = "";
  }
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("動画のシークに失敗しました"));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = time;
  });
}
