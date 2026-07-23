import cors from "cors";
import express from "express";
import recommendationsRouter from "./routes/recommendations.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
	res.json({ ok: true });
});

app.use("/api", recommendationsRouter);

export default app;