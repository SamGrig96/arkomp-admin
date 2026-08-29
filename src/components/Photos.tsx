import { useRef, useState } from "react";
import * as api from "../lib/api";
import type { AdminImage } from "../lib/types";
import { move } from "../lib/move";

const kb = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

/**
 * Photo manager for one product. Uploads, alt text and order are saved as they
 * happen rather than gathered behind a Save button — a photo either reached the
 * server or it did not, and waiting to find out helps nobody.
 */
export function Photos({
  slug,
  images,
  onChanged,
  onError,
}: {
  slug: string;
  images: AdminImage[];
  onChanged: (images: AdminImage[]) => void;
  onError: (message: string) => void;
}) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | File[]) {
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      onError("Ընտրված ֆայլերը նկար չեն։");
      return;
    }

    setBusy(true);
    try {
      for (const [i, file] of list.entries()) {
        setProgress(`${i + 1} / ${list.length}`);
        await api.uploadImage(slug, file, {});
      }
      onChanged((await api.getProduct(slug)).images);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Վերբեռնումը չհաջողվեց։");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function reorder(from: number, to: number) {
    const next = move(images, from, to);
    onChanged(next); // optimistic: the grid should not lag behind the click
    try {
      await api.reorderImages(slug, next.map((i) => i.id));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Հերթականությունը չպահվեց։");
      onChanged(images);
    }
  }

  async function remove(image: AdminImage) {
    if (!confirm("Ջնջե՞լ այս նկարը։ Գործողությունն անշրջելի է։")) return;
    try {
      await api.deleteImage(image.id);
      onChanged(images.filter((i) => i.id !== image.id));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Չհաջողվեց ջնջել։");
    }
  }

  async function saveAlt(image: AdminImage, alt: Record<string, string>) {
    try {
      await api.updateImage(image.id, { alt });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Alt տեքստը չպահվեց։");
    }
  }

  return (
    <div className="card">
      <div className="card__head">
        <div>
          <h2>Լուսանկարներ</h2>
          <p>
            Առաջին նկարը քարտի շապիկն է։ Մնացածը երևում են ապրանքի էջի
            պատկերասրահում։
          </p>
        </div>
      </div>

      <div
        className={over ? "dropzone dropzone--over" : "dropzone"}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void upload(e.dataTransfer.files);
        }}
      >
        {busy
          ? `Վերբեռնվում է… ${progress}`
          : "Քաշիր նկարները այստեղ, կամ սեղմիր՝ ընտրելու համար"}
        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          JPEG, PNG, WebP, AVIF կամ GIF · մինչև 8 ՄԲ
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {images.length === 0 ? null : (
        <div className="photos">
          {images.map((image, i) => (
            <div className="photo" key={image.id}>
              <img className="photo__img" src={image.url} alt="" />
              <div className="photo__body">
                <input
                  type="text"
                  defaultValue={image.alt.hy ?? ""}
                  placeholder="Alt՝ հայերեն"
                  onBlur={(e) =>
                    void saveAlt(image, { ...image.alt, hy: e.target.value })
                  }
                />
                <input
                  type="text"
                  defaultValue={image.alt.ru ?? ""}
                  placeholder="Alt՝ ռուսերեն"
                  onBlur={(e) =>
                    void saveAlt(image, { ...image.alt, ru: e.target.value })
                  }
                />
                <div className="photo__foot">
                  <button
                    className="btn btn--ghost btn--icon"
                    title="Առաջ"
                    disabled={i === 0}
                    onClick={() => void reorder(i, i - 1)}
                  >
                    ←
                  </button>
                  <button
                    className="btn btn--ghost btn--icon"
                    title="Հետ"
                    disabled={i === images.length - 1}
                    onClick={() => void reorder(i, i + 1)}
                  >
                    →
                  </button>
                  <button
                    className="btn btn--danger btn--icon"
                    title="Ջնջել"
                    onClick={() => void remove(image)}
                  >
                    ✕
                  </button>
                  <span className="photo__size">{kb(image.byteSize)}</span>
                </div>
                {i === 0 ? (
                  <span className="badge badge--cover" style={{ marginTop: 8 }}>
                    Շապիկ
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
