import { RequestHandler } from "express";
import { sendErrorRes } from "src/utils/helper";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import UserModel from "src/models/user";
import PasswordResetTokenModel from "src/models/passwordResetToken";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  avatar?: string;
}

declare global {
  namespace Express {
    interface Request {
      user: UserProfile;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET!;

export const isAuth: RequestHandler = async (req, res, next) => {
  /**
1. Read authorization header
2. See if we have the token.
3. Send error if there is no token.
4. Verify the token (we have to use jwt.verify).
5. Take out the user id from token (we will have it as payload).
6. Check if we have the user with this id.
7. Send error if not.
8. Attach user profile inside req object.
9. Call `next` function
10. Handle error for expired tokens. 
     **/

  try {
    const authToken = req.headers.authorization;
    if (!authToken) return sendErrorRes(res, "unauthorized request!", 403);

    const token = authToken.split("Bearer ")[1];
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await UserModel.findById(payload.id);
    if (!user) return sendErrorRes(res, "unauthorized request!", 403);

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avatar?.url,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return sendErrorRes(res, "Session expired!", 401);
    }

    if (error instanceof JsonWebTokenError) {
      return sendErrorRes(res, "unauthorized assess!", 401);
    }

    next(error);
  }
};

export const isValidPassResetToken: RequestHandler = async (req, res, next) => {
  /**
1. Read token and id
2. Find token inside database with owner id.
3. If there is no token send error.
4. Else compare token with encrypted value.
5. If not matched send error.
6. Else call next function.
     **/

  const { id, token } = req.body;
  const resetPassToken = await PasswordResetTokenModel.findOne({ owner: id });
  if (!resetPassToken)
    return sendErrorRes(res, "Unauthorized request, invalid token!", 403);

  const matched = await resetPassToken.compareToken(token);
  if (!matched)
    return sendErrorRes(res, "Unauthorized request, invalid token!", 403);

  next();
};
