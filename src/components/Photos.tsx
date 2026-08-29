import { useRef, useState } from "react";
import * as api from "../lib/api";
import { describeError } from "../lib/errors";
import { useT } from "../lib/i18n";
import { move } from "../lib/move";
import type { AdminImage } from "../lib/types";
import { CONTENT_LOCALES, CONTENT_LOCALE_LABELS } from "../lib/types";

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
  const t = useT();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | File[]) {
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      onError(t.photos.notImages);
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
      onError(describeError(e, t, t.photos.uploadFailed));
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
      onError(describeError(e, t, t.photos.orderFailed));
      onChanged(images);
    }
  }

  async function remove(image: AdminImage) {
    if (!confirm(t.photos.confirmDelete)) return;
    try {
      await api.deleteImage(image.id);
      onChanged(images.filter((i) => i.id !== image.id));
    } catch (e) {
      onError(describeError(e, t, t.photos.deleteFailed));
    }
  }

  async function saveAlt(image: AdminImage, alt: Record<string, string>) {
    try {
      await api.updateImage(image.id, { alt });
    } catch (e) {
      onError(describeError(e, t, t.photos.altFailed));
    }
  }

  return (
    <div className="card">
      <div className="card__head">
        <div>
          <h2>{t.photos.title}</h2>
          <p>{t.photos.lead}</p>
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
        {busy ? t.photos.uploading(progress) : t.photos.drop}
        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          {t.photos.formats}
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
                {/* Alt text belongs to the content languages, not to the panel's,
                    so these stay labelled in the language they are written in. */}
                {CONTENT_LOCALES.map((locale) => (
                  <input
                    key={locale}
                    type="text"
                    defaultValue={image.alt[locale] ?? ""}
                    placeholder={t.photos.altFor(CONTENT_LOCALE_LABELS[locale])}
                    onBlur={(e) =>
                      void saveAlt(image, { ...image.alt, [locale]: e.target.value })
                    }
                  />
                ))}
                <div className="photo__foot">
                  <button
                    className="btn btn--ghost btn--icon"
                    title={t.photos.moveBack}
                    disabled={i === 0}
                    onClick={() => void reorder(i, i - 1)}
                  >
                    ←
                  </button>
                  <button
                    className="btn btn--ghost btn--icon"
                    title={t.photos.moveForward}
                    disabled={i === images.length - 1}
                    onClick={() => void reorder(i, i + 1)}
                  >
                    →
                  </button>
                  <button
                    className="btn btn--danger btn--icon"
                    title={t.common.remove}
                    onClick={() => void remove(image)}
                  >
                    ✕
                  </button>
                  <span className="photo__size">{kb(image.byteSize)}</span>
                </div>
                {i === 0 ? (
                  <span className="badge badge--cover" style={{ marginTop: 8 }}>
                    {t.photos.cover}
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
