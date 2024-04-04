import { Router } from "express";
import {createPlaylist,
    addVideoToPlaylist,
    updatePlaylist,
    deletePlaylist,
    removeVideoFromPlaylist,
    getUserPlaylist,
    getPlaylistById
    } from '../controller/playlist.controller.js'

import {verifyJwt} from '../Middleware/auth.middleware.js'

const router = Router();

router.use(verifyJwt);

router.route('/').post(createPlaylist)
router.route("/:playlistId")
            .get(getPlaylistById)
            .patch(updatePlaylist)
            .delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylist);

           

export default router