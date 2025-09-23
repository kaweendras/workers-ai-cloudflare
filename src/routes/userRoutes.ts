import express from "express";
const router = express.Router();
import * as userController from "../controllers/userControllers";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware";

/**
 * POST api/v1/users/login
 * Login user
 */
router.post("/users/login", userController.loginUserController);

/**
 * POST api/v1/users/create
 * Add a new user
 */
router.post(
  "/users/create",
  adminMiddleware,
  userController.createUsersController
);

/**
 * GET api/v1/users/getall
 * Get all users
 */
router.get(
  "/users/getall",
  authMiddleware,
  userController.getAllUsersController
);

/**
 * GET api/v1/users/profile
 * Get user profile
 */
router.get(
  "/users/profile",
  authMiddleware,
  userController.getProfileController
);

/**
 * GET api/v1/users/getUserByEmail
 * Get user Email
 */
router.get(
  "/users/getUserByEmail",
  authMiddleware,
  userController.getUserByEmailController
);

/**
 * DELETE api/v1/users/deleteUserByEmail
 * Delete user by email (admin only)
 */
router.delete(
  "/users/deleteUserByEmail",
  adminMiddleware,
  userController.deleteUserByEmailController
);

export default router;
