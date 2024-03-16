## TS Config `tsconfig.json`

```
{
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2016",
    "noImplicitAny": true,
    "removeComments": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "src/*": ["./src/*"],
      "routes/*": ["./src/routes/*"],
      "controllers/*": ["./src/controllers/*"]
    }
  }
}
```

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

## RegEx For Email & Password

```
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/;
```

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
3. Send error if there is no token.
4. Verify the token (we have to use jwt.verify).
5. Take out the user id from token (we will have it as payload).
6. Check if we have the user with this id.
7. Send error if not.
8. Attach user profile inside req object.
9. Call `next` function
10. Handle error for expired tokens.

- `/verify-token`

1. Check if user is authenticated or not
2. Remove previous token if any
3. Create/store new token and
4. Send link inside users email
5. Send response back

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

- `/update-profile`

1. User must be logged in (authenticated).
2. Name must be valid.
3. Find user and update the name.
4. Send new profile back.

- `/update-avatar`

1. User must be logged in.
2. Read incoming file.
3. File type must be image.
4. Check if user already have avatar or not.
5. If yes the remove the old avatar.
6. Upload new avatar and update user.
7. Send response back.

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="style/index.css" />
    <title>Reset Password - Smart Cycle Market</title>
  </head>
  <body>
    <div class="container">
      <p id="message">Please wait, we are verifying your account</p>
      <form id="form">
        <div>
          <h2>Confirm Password</h2>
          <div id="notification" class="notification-container"></div>
          <div class="form-group">
            <label for="password">New Password:</label>
            <input type="password" id="password" name="password" />
          </div>
          <div class="form-group">
            <label for="confirm-password">Confirm New Password:</label>
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
            />
          </div>
          <button id="submit" type="submit">Update Password</button>
        </div>
      </form>
    </div>

    <script src="js/reset-pass.js"></script>
  </body>
</html>

```

# Product

The interface for products.

```
type productImage = { url: string; id: string };

export interface ProductDocument extends Document {
  owner: Schema.Types.ObjectId;
  name: string;
  price: number;
  purchasingDate: Date;
  category: string;
  images: productImage[];
  thumbnail: string;
  description: string;
}
```

## Product Routes

```
productRouter.post("/list");
productRouter.patch("/:id");
productRouter.delete("/:id");
productRouter.delete("/image/:productId/:imageId");
productRouter.get("/detail/:id");
productRouter.get("/by-category/:category");
productRouter.get("/latest");
productRouter.get("/listings");
```

- `/list`

1. User must be authenticated.
2. User can upload images as well.
3. Validate incoming data.
4. Validate and Upload File (or Files) - note (restrict image qty).
5. Create Product.
6. And send the response back.

- `/:id` (patch to update)

1. User must be authenticated.
2. User can upload images as well.
3. Validate incoming data.
4. Update normal properties.
5. Upload and update images (restrict image qty).
6. And send the response back.

- `/:id` (delete single product)

1. User must be authenticated.
2. Validate the product id.
3. Remove if it is made by the same user.
4. Remove images as well.
5. And send the response back.

- `/image/:productId/:imageId` (delete only image of the product)

1. User must be authenticated.
2. Validate the product id.
3. Remove the image from db (if it is made by the same user).
4. Remove from cloud as well.
5. And send the response back.

- `/detail/:id` (get product details)

1. User must be authenticated (optional).
2. Validate the product id.
3. Find Product by the id.
4. Format data.
5. And send the response back.

- `/by-category/:category` (multiple products by category)

1. User must be authenticated (optional).
2. Validate the category.
3. Find products by category (apply pagination if needed).
4. Format data.
5. And send the response back.

- `/latest` (multiple products sorted with created date)

1. User must be authenticated (optional).
2. Find all the products with sorted date (apply limit/pagination if needed).
3. Format data.
4. And send the response back.

- `/listings` (products created by the user)

1. User must be authenticated.
2. Find all the products created by this user (apply pagination if needed).
3. Format data.
4. And send the response back.
