import { verifyJwt } from "../utils/verifyJwt.js";

export const requireSocketAuth = async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers?.cookie;
    let cookieToken = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.split("=").map((c) => c.trim());
        acc[key] = value;
        return acc;
      }, {});
      cookieToken = cookies.accessToken;
    }

    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
      cookieToken;

    if (!token) {
      throw new Error("Unauthorized.");
    }

    const decoded = await verifyJwt(token);

    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error(error.message || "Unauthorized."));
  }
};
