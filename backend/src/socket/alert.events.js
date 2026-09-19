import { Alert } from "../models/alert.model.js";

export const registerAlertEvents = (io, socket) => {
  const userId = socket.user._id.toString();

  // Create Alert Handler
  socket.on("create:alert", async (data) => {
    try {
      const newAlert = await Alert.create({
        userId,
        symbol: data.symbol,
        targetPrice: data.targetPrice,
        condition: data.condition?.toUpperCase(),
      });

      io.to(userId).emit("created:alert", newAlert);
    } catch (error) {
      socket.emit("error:alert", {
        message: "Failed to create alert",
        error: error.message,
      });
    }
  });

  // Delete Alert Handler
  socket.on("delete:alert", async (data) => {
    try {
      const deletedAlert = await Alert.findByIdAndDelete(data._id);

      if (!deletedAlert) {
        return socket.emit("error:alert", { message: "Alert not found" });
      }

      io.to(userId).emit("deleted:alert", deletedAlert);
    } catch (error) {
      socket.emit("error:alert", {
        message: "Failed to delete alert",
        error: error.message,
      });
    }
  });
};
