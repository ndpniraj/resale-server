import express, { RequestHandler } from "express";

const app = express();

// const bodyParser: RequestHandler = (req, res, next) => {
//   req.on("data", (chunk) => {
//     req.body = JSON.parse(chunk);
//     next();
//   });
// };

// app.use(bodyParser);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.json({ message: "This message is coming from server." });
});

app.post("/", (req, res) => {
  console.log(req.body);
  res.json({ message: "This message is coming from post request." });
});

app.post("/create-new-product", (req, res) => {
  console.log(req.body);
  res.json({ message: "This message is coming from product create." });
});

app.listen(8000, () => {
  console.log("The app is running on http://localhost:8000");
});
