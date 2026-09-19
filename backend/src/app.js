import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { healthcheck } from "./controllers/healthcheck.controller.js";
import userRouter from "./routes/user.routes.js";

const app = express();

// const allowedOrigins = ["*"];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin) return callback(null, true);

//       if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
//         return callback(null, true);
//       }

//       callback(new Error("Not allowed by CORS"));
//     },
//     methods: ["GET", "POST", "PATCH", "DELETE"],
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/health", healthcheck);
app.use("/api/v1/health", healthcheck);
app.use("/api/v1/users", userRouter);
// app.use("/api/v1/messages", messageRouter);

app.use((err, req, res, next) => {
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error.",
    stack: process.env.NODE_ENV === "development" ? err.stack : {}, // remove it later in production
    // or better yet, implement a logging software.
  });
});

export { app };
