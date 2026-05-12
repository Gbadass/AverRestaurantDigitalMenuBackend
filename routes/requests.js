import { Router } from "express";
import { requireAnyAuth } from "../middleware/requireAnyAuth.js";
import { createRequest, getRequests, updateRequest } from "../controller/requests.js";

const router = Router();

router.post("/", createRequest);
router.get("/", requireAnyAuth, getRequests);
router.patch("/:id", requireAnyAuth, updateRequest);

export default router;
