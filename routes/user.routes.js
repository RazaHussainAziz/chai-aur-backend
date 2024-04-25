import { Router } from "express";
import { 
         registerUser,
         loginUser,
         logoutUser,
         refreshedAccessToken,
         changePassword,
         getUser,
         changeAvatar,
         getChannelProfile
    } 
from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.fields([{
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),registerUser);

router.route("/login").post(loginUser);

//secure Routes
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-token").post(refreshedAccessToken);
router.route("/change-password").post(verifyJWT,changePassword)
router.route("/change-avatar").post(verifyJWT,upload.single("avatar"),changeAvatar)
router.route("/profile").post(verifyJWT,getUser);
router.route("/:username").post(verifyJWT,getChannelProfile);

export default router;