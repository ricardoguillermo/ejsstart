import { Router } from "express";
import QRCode from "qrcode";

const router = Router();

function itemUrl(req, id) {
  const base = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  return `${base}/items/${id}`;
}

router.get("/qr/:id", async (req, res) => {
  try {
    const { format = "png", size = "300", margin = "2" } = req.query;
    const text = itemUrl(req, req.params.id);

    if (format === "svg") {
      const svg = await QRCode.toString(text, {
        type: "svg",
        margin: Number(margin),
        width: Number(size),
      });
      res.setHeader("Content-Type", "image/svg+xml");
      return res.send(svg);
    }

    const buf = await QRCode.toBuffer(text, {
      type: "png",
      margin: Number(margin),
      width: Number(size),
    });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).send("QR error");
  }
});

export default router;
