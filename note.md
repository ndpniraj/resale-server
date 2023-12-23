## Auth Routes

```
authRouter.post("/sign-up");
authRouter.post("/verify");
authRouter.post("/sign-in");
authRouter.get("/verify-token");
authRouter.post("/refresh-token");
authRouter.post("/sign-out");
authRouter.get("/profile");
authRouter.get("/profile/:id");
authRouter.post("/update-avatar");
authRouter.post("/update-profile");
authRouter.post("/forget-pass");
authRouter.post("/verify-pass-reset-token");
authRouter.post("/reset-pass");
```

- `/sign-up`

1. Read incoming data like: name, email, password
2. Validate if the data is ok or not.
3. Send error if not.
4. Check if we already have account with same user.
5. Send error if yes otherwise create new account and save user inside DB.
6. Generate and Store verification token.
7. Send verification link with token to register email.
8. Send message back to check email inbox.

- `/verify`

1. Read incoming data like: id and token
2. Find the token inside DB (using owner id).
3. Send error if token not found.
4. Check if the token is valid or not (because we have the encrypted value).
5. If not valid send error otherwise update user is verified.
6. Remove token from database.
7. Send success message.

- `/sign-in`

1. Read incoming data like: email and password
2. Find user with the provided email.
3. Send error if user not found.
4. Check if the password is valid or not (because pass is in encrypted form).
5. If not valid send error otherwise generate access & refresh token.
6. Store refresh token inside DB.
7. Send both tokens to user.

- `/is-auth`

1. Read authorization header
2. See if we have the token.
3. Send error if user not.
4. Verify the token (we have to use jwt.verify).
5. Take out the user id from token (we will have it as payload).
6. Check if we have the user with this id.
7. Send error if not.
8. Attach user profile inside req object.
9. Call `next` function
10. Handle error for expired tokens.

- `/verify-token`

1. check if user is authenticated or not
2. remove previous token if any
3. create/store new token and send response back

- `/refresh-token`

1. Read and verify refresh token
2. Find user with payload.id and refresh token
3. If the refresh token is valid and no user found, token is compromised.
4. Remove all the previous tokens and send error response.
5. If the the token is valid and user found create new refresh and access token.
6. Remove previous token, update user and send new tokens.

- `/sign-out`

1. Remove the refresh token

- `/forget-pass`

1. Ask for users email
2. Find user with the given email.
3. Send error if there is no user.
4. Else generate password reset token (first remove if there is any).
5. Generate reset link (like we did for verification)
6. Send link inside user's email.
7. Send response back.

- `/verify-pass-reset-token`

1. Read token and id
2. Find token inside database with owner id.
3. If there is no token send error.
4. Else compare token with encrypted value.
5. If not matched send error.
6. Else call next function.

- `/reset-pass`

1. Read user id, reset pass token and password.
2. Validate all these things.
3. If valid find user with the given id.
4. Check if user is using same password.
5. If there is no user or user is using the same password send error res.
6. Else update new password.
7. Remove password reset token.
8. Send confirmation email.
9. Send response back.
