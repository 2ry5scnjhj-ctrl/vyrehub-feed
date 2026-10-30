const http = require("http");
const PORT = process.env.PORT || 3000;
const KEY = process.env.KEY || "change-me";
let feed = [];

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  const url = new URL(req.url, "http://x");

  if (req.method === "GET" && url.pathname === "/feed") {
    const since = Number(url.searchParams.get("since") || 0);
    const now = Date.now();
    feed = feed.filter(e => now - e.time < 5 * 60 * 1000);
    res.end(JSON.stringify(feed.filter(e => e.time > since)));
    return;
  }

  if (req.method === "POST" && url.pathname === "/report") {
    let body = "";
    req.on("data", c => { body += c; if (body.length > 10000) req.destroy(); });
    req.on("end", () => {
      try {
        const d = JSON.parse(body);
        if (d.key !== KEY || !d.jobId || !Array.isArray(d.pets)) {
          res.statusCode = 400;
          return res.end("{}");
        }
        feed = feed.filter(e => e.jobId !== d.jobId);
        feed.push({
          jobId: String(d.jobId),
          placeId: d.placeId,
          pets: d.pets.slice(0, 20).map(String),
          players: String(d.players || "?"),
          time: Date.now(),
        });
        res.end('{"ok":true}');
      } catch (e) {
        res.statusCode = 400;
        res.end("{}");
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end("{}");
}).listen(PORT, () => console.log("VyreHub feed sur le port " + PORT));
