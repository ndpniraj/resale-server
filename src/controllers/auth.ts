import { RequestHandler } from "express";
import UserModel from "src/models/user";
import crypto from "crypto";
import nodemailer from "nodemailer";
import AuthVerificationTokenModel from "src/models/authVeirficationToken";
import { sendErrorRes } from "src/utils/helper";
import jwt from "jsonwebtoken";
import mail from "src/utils/mail";
import PasswordResetTokenModel from "src/models/passwordResetToken";
import { isValidObjectId } from "mongoose";
import cloudUploader from "src/cloud";

const VERIFICATION_LINK = process.env.VERIFICATION_LINK;
const JWT_SECRET = process.env.JWT_SECRET!;
const PASSWORD_RESET_LINK = process.env.PASSWORD_RESET_LINK!;

export const createNewUser: RequestHandler = async (req, res) => {
  // Read incoming data like: name, email, password
  const { email, password, name } = req.body;

  // Validate if the data is ok or not.
  // Send error if not.
  // if (!name) return sendErrorRes(res, "Name is missing!", 422);
  // if (!email) return sendErrorRes(res, "Email is missing!", 422);
  // if (!password) return sendErrorRes(res, "Password is missing!", 422);

  // 4. Check if we already have account with same user.
  const existingUser = await UserModel.findOne({ email });
  // 5. Send error if yes otherwise create new account and save user inside DB.
  if (existingUser)
    return sendErrorRes(
      res,
      "Unauthorized request, email is already in use!",
      401
    );

  const user = await UserModel.create({ name, email, password });

  // 6. Generate and Store verification token.
  const token = crypto.randomBytes(36).toString("hex");
  await AuthVerificationTokenModel.create({ owner: user._id, token });

  // 7. Send verification link with token to register email.
  const link = `${VERIFICATION_LINK}?id=${user._id}&token=${token}`;

  // const transport = nodemailer.createTransport({
  //   host: "sandbox.smtp.mailtrap.io",
  //   port: 2525,
  //   auth: {
  //     user: "c5cf93b6836166",
  //     pass: "081dde13a955c9",
  //   },
  // });

  // await transport.sendMail({
  //   from: "verification@myapp.com",
  //   to: user.email,
  //   html: `<h1>Please click on <a href="${link}">this link</a> to verify your account.</h1>`,
  // });

  await mail.sendVerification(user.email, link);

  // 8. Send message back to check email inbox.
  res.json({ message: "Please check your inbox." });
};

export const verifyEmail: RequestHandler = async (req, res) => {
  /**
1. Read incoming data like: id and token
2. Find the token inside DB (using owner id).
3. Send error if token not found.
4. Check if the token is valid or not (because we have the encrypted value).
5. If not valid send error otherwise update user is verified.
6. Remove token from database.
7. Send success message.
   **/
  const { id, token } = req.body;

  const authToken = await AuthVerificationTokenModel.findOne({ owner: id });
  if (!authToken) return sendErrorRes(res, "unauthorized request!", 403);

  const isMatched = await authToken.compareToken(token);
  if (!isMatched)
    return sendErrorRes(res, "unauthorized request, invalid token!", 403);

  await UserModel.findByIdAndUpdate(id, { verified: true });

  await AuthVerificationTokenModel.findByIdAndDelete(authToken._id);

  res.json({ message: "Thanks for joining us, your email is verified." });
};

export const generateVerificationLink: RequestHandler = async (req, res) => {
  /**
1. check if user is authenticated or not
2. remove previous token if any
3. create/store new token and 
4. send link inside users email
5. send response back
   **/
  const { id } = req.user;
  const token = crypto.randomBytes(36).toString("hex");

  const link = `${VERIFICATION_LINK}?id=${id}&token=${token}`;

  await AuthVerificationTokenModel.findOneAndDelete({ owner: id });

  await AuthVerificationTokenModel.create({ owner: id, token });

  await mail.sendVerification(req.user.email, link);

  res.json({ message: "Please check your inbox." });
};

export const signIn: RequestHandler = async (req, res) => {
  /**
1. Read incoming data like: email and password
2. Find user with the provided email.
3. Send error if user not found.
4. Check if the password is valid or not (because pass is in encrypted form).
5. If not valid send error otherwise generate access & refresh token.
6. Store refresh token inside DB.
7. Send both tokens to user.
    **/

  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) return sendErrorRes(res, "Email/Password mismatch!", 403);

  const isMatched = await user.comparePassword(password);
  if (!isMatched) return sendErrorRes(res, "Email/Password mismatch!", 403);

  const payload = { id: user._id };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, JWT_SECRET);

  if (!user.tokens) user.tokens = [refreshToken];
  else user.tokens.push(refreshToken);

  await user.save();

  res.json({
    profile: {
      id: user._id,
      email: user.email,
      name: user.name,
      verified: user.verified,
      avatar: user.avatar?.url,
    },
    tokens: { refresh: refreshToken, access: accessToken },
  });
};

export const sendProfile: RequestHandler = async (req, res) => {
  res.json({
    profile: req.user,
  });
};

export const grantAccessToken: RequestHandler = async (req, res) => {
  /**
1. Read and verify refresh token
2. Find user with payload.id and refresh token
3. If the refresh token is valid and no user found, token is compromised.
4. Remove all the previous tokens and send error response.
5. If the the token is valid and user found create new refresh and access token.
6. Remove previous token, update user and send new tokens.  
  **/

  const { refreshToken } = req.body;

  if (!refreshToken) return sendErrorRes(res, "Unauthorized request!", 403);

  const payload = jwt.verify(refreshToken, JWT_SECRET) as { id: string };

  if (!payload.id) return sendErrorRes(res, "Unauthorized request!", 401);

  const user = await UserModel.findOne({
    _id: payload.id,
    tokens: refreshToken,
  });

  if (!user) {
    // user is compromised, remove all the previous tokens
    await UserModel.findByIdAndUpdate(payload.id, { tokens: [] });
    return sendErrorRes(res, "Unauthorized request!", 401);
  }

  const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: "15m",
  });
  const newRefreshToken = jwt.sign({ id: user._id }, JWT_SECRET);

  const filteredTokens = user.tokens.filter((t) => t !== refreshToken);
  user.tokens = filteredTokens;
  user.tokens.push(newRefreshToken);
  await user.save();

  res.json({
    tokens: { refresh: newRefreshToken, access: newAccessToken },
  });
};

export const signOut: RequestHandler = async (req, res) => {
  /**
     Remove the refresh token
  **/

  const { refreshToken } = req.body;
  const user = await UserModel.findOne({
    _id: req.user.id,
    tokens: refreshToken,
  });
  if (!user)
    return sendErrorRes(res, "Unauthorized request, user not found!", 403);

  const newTokens = user.tokens.filter((t) => t !== refreshToken);
  user.tokens = newTokens;
  await user.save();

  res.send();
};

export const generateForgetPassLink: RequestHandler = async (req, res) => {
  /**
1. Ask for users email
2. Find user with the given email.
3. Send error if there is no user.
4. Else generate password reset token (first remove if there is any).
5. Generate reset link (like we did for verification)
6. Send link inside user's email.
7. Send response back.
  **/

  const { email } = req.body;
  const user = await UserModel.findOne({ email });

  if (!user) return sendErrorRes(res, "Account not found!", 404);

  // Remove token
  await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });

  // Create new token
  const token = crypto.randomBytes(36).toString("hex");
  await PasswordResetTokenModel.create({ owner: user._id, token });

  // send the link to user's email
  const passResetLink = `${PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`;
  await mail.sendPasswordResetLink(user.email, passResetLink);

  // send response back
  res.json({ message: "Please check your email." });
};

export const grantValid: RequestHandler = async (req, res) => {
  res.json({ valid: true });
};

export const updatePassword: RequestHandler = async (req, res) => {
  /**
1. Read user id, reset pass token and password.
2. Validate all these things.
3. If valid find user with the given id.
4. Check if user is using same password.
5. If there is no user or user is using the same password send error res.
6. Else update new password.
7. Remove password reset token.
8. Send confirmation email.
9. Send response back. 
  **/

  const { id, password } = req.body;

  const user = await UserModel.findById(id);
  if (!user) return sendErrorRes(res, "Unauthorized access!", 403);

  const matched = await user.comparePassword(password);
  if (matched)
    return sendErrorRes(res, "The new password must be different!", 422);

  user.password = password;
  await user.save();

  await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });

  await mail.sendPasswordUpdateMessage(user.email);
  res.json({ message: "Password resets successfully." });
};

export const updateProfile: RequestHandler = async (req, res) => {
  /**
1. User must be logged in (authenticated).
2. Name must be valid.
3. Find user and update the name.
4. Send new profile back.
  **/

  const { name } = req.body;

  if (typeof name !== "string" || name.trim().length < 3) {
    return sendErrorRes(res, "Invalid name!", 422);
  }

  await UserModel.findByIdAndUpdate(req.user.id, { name });

  res.json({ profile: { ...req.user, name } });
};

export const updateAvatar: RequestHandler = async (req, res) => {
  /**
1. User must be logged in.
2. Read incoming file.
3. File type must be image.
4. Check if user already have avatar or not.
5. If yes the remove the old avatar.
6. Upload new avatar and update user.
7. Send response back.
  **/

  const { avatar } = req.files;
  if (Array.isArray(avatar)) {
    return sendErrorRes(res, "Multiple files are not allowed!", 422);
  }

  if (!avatar.mimetype?.startsWith("image")) {
    return sendErrorRes(res, "Invalid image file!", 422);
  }

  const user = await UserModel.findById(req.user.id);
  if (!user) {
    return sendErrorRes(res, "User not found!", 404);
  }

  if (user.avatar?.id) {
    // remove avatar file
    await cloudUploader.destroy(user.avatar.id);
  }

  // upload avatar file
  const { secure_url: url, public_id: id } = await cloudUploader.upload(
    avatar.filepath,
    {
      width: 300,
      height: 300,
      crop: "thumb",
      gravity: "face",
    }
  );
  user.avatar = { url, id };
  await user.save();

  res.json({ profile: { ...req.user, avatar: user.avatar.url } });
};

export const sendPublicProfile: RequestHandler = async (req, res) => {
  const profileId = req.params.id;
  if (!isValidObjectId(profileId)) {
    return sendErrorRes(res, "Invalid profile id!", 422);
  }

  const user = await UserModel.findById(profileId);
  if (!user) {
    return sendErrorRes(res, "Profile not found!", 404);
  }

  res.json({
    profile: { id: user._id, name: user.name, avatar: user.avatar?.url },
  });
};
