## Auth Routes

```
authRouter.post("/sign-up");
authRouter.post("/verify");
authRouter.post("/sign-in");
authRouter.post("/refresh-token");
authRouter.post("/sign-out");
authRouter.get("/profile");
authRouter.get("/profile/:id");
authRouter.post("/verify-token");
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
