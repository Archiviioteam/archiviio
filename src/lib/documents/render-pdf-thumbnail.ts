"use client";

import * as pdfjs from "pdfjs-dist";

let workerConfigured = false;

function configurePdfWorker() {
  if (workerConfigured || typeof window === "undefined") {
    return;
  }

  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  workerConfigured = true;
}

export async function renderPdfThumbnail(
  url: string,
  width = 960
): Promise<string | null> {
  configurePdfWorker();

  try {
    const pdf = await pdfjs.getDocument({ url }).promise;
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = width / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;

    return canvas.toDataURL("image/jpeg", 0.9);
  } catch {
    return null;
  }
}
