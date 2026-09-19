import router from "express";
import { getAllSharesList } from "../controllers/share.controllers";
const shareRouter = router();

shareRouter.get("/all", getAllSharesList);

export default shareRouter;
