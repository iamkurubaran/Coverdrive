import { useState } from "react";
import { Icon } from "./icons";
import { renderCardBlob, downloadBlob } from "./cardImage";

export default function ShareBar({ card }) {
  const [busy, setBusy] = useState("");
  const [done, setDone] = useState("");

  function flash(key) {
    setDone(key);
    setTimeout(() => setDone(""), 1800);
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}?u=${card.username}`;
  const shareText = `${card.name} is a ${card.overall}-rated ${card.tier.name} ${card.role.name} on Coverdrive 🏏`;

  function postX() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener"
    );
  }

  function postLinkedIn() {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener"
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flash("link");
    } catch {
      /* clipboard unavailable */
    }
  }

  async function download() {
    setBusy("download");
    try {
      const blob = await renderCardBlob(card);
      downloadBlob(blob, `coverdrive-${card.username}.png`);
      flash("download");
    } finally {
      setBusy("");
    }
  }

  async function copyImage() {
    setBusy("copyimg");
    try {
      const blob = await renderCardBlob(card);
      if (navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        flash("copyimg");
      } else {
        downloadBlob(blob, `coverdrive-${card.username}.png`);
        flash("copyimg");
      }
    } catch {
      /* user denied or unsupported */
    } finally {
      setBusy("");
    }
  }

  async function story() {
    setBusy("story");
    try {
      const blob = await renderCardBlob(card, { story: true });
      downloadBlob(blob, `coverdrive-${card.username}-story.png`);
      flash("story");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="share">
      <div className="share-row">
        <button className="share-btn" onClick={postX}>
          <Icon name="x" size={16} /> <span>Post</span>
        </button>
        <button className="share-btn" onClick={postLinkedIn}>
          <Icon name="linkedin" size={16} /> <span>LinkedIn</span>
        </button>
        <button className="share-btn" onClick={copyLink}>
          <Icon name={done === "link" ? "check" : "link"} size={16} />
          <span>{done === "link" ? "Copied" : "Copy link"}</span>
        </button>
      </div>
      <div className="share-row">
        <button className="share-btn share-primary" onClick={download} disabled={busy === "download"}>
          <Icon name={done === "download" ? "check" : "download"} size={16} />
          <span>{busy === "download" ? "Rendering…" : done === "download" ? "Saved" : "Download"}</span>
        </button>
        <button className="share-btn" onClick={copyImage} disabled={busy === "copyimg"}>
          <Icon name={done === "copyimg" ? "check" : "copy"} size={16} />
          <span>{busy === "copyimg" ? "Rendering…" : done === "copyimg" ? "Copied" : "Copy image"}</span>
        </button>
      </div>
      <div className="share-row">
        <button className="share-btn share-wide" onClick={story} disabled={busy === "story"}>
          <Icon name="image" size={16} />
          <span>{busy === "story" ? "Rendering…" : done === "story" ? "Saved" : "Story format"}</span>
        </button>
      </div>
    </div>
  );
}
