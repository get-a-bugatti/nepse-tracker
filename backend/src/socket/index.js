import { Server } from "socket.io";
import { requireSocketAuth } from "../middlewares/socketAuth.middleware.js";
import { registerAlertEvents } from "./alert.events.js";

class SocketService {
  constructor() {
    this._io = null;
  }

  init(httpServer) {
    if (this._io) {
      console.warn("Socket server already initialized.");
      return this._io;
    }

    this._io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"],
      },
    });

    this._io.use(requireSocketAuth);

    this._registerEvents();

    return this._io;
  }

  _registerEvents() {
    this._io.on("connection", (socket) => {
      console.log(
        `⚡ Client connected: ${socket.id} | User: ${socket.user.username}`
      );

      const userId = socket.user._id.toString();

      socket.join(userId);

      registerAlertEvents(this._io, socket);

      socket.on("error", (error) => {
        console.error(`Socket error for client ${socket.id}:`, error);
      });

      socket.on("disconnect", (reason) => {
        console.log(`🔌 Client disconnected: ${socket.id} | Reason: ${reason}`);
      });
    });
  }

  // Safe getter for the IO instance to use anywhere else in your app
  get io() {
    if (!this._io) {
      throw new Error(
        "Socket.IO has not been initialized. Call init(httpServer) first."
      );
    }
    return this._io;
  }

  close() {
    if (this._io) {
      this._io.close();
      this._io = null;
    }
  }

  sendLastCheckedAt({ securityId, symbol, lastCheckedAt }) {
    this._io.emit("update:lastCheckedAt", {
      securityId: data.securityId,
      symbol: data.symbol,
      lastCheckedAt: data.lastCheckedAt,
    });
  }

  sendLastUpdatedPrice({
    securityId,
    symbol,
    lastUpdatedPrice,
    lastUpdatedAt,
    lastCheckedAt,
  }) {
    this._io.emit("update:lastUpdated", {
      securityId: data.securityId,
      symbol: data.symbol,
      lastUpdatedPrice: data.lastUpdatedPrice,
      lastUpdatedAt: data.lastUpdatedAt,
      lastCheckedAt: data.lastCheckedAt,
    });
  }
}

export const socketService = new SocketService();
