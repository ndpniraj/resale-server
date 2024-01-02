import { Router } from "express";
import {
  deleteProduct,
  deleteProductImage,
  getLatestProducts,
  getListings,
  getProductDetail,
  getProductsByCategory,
  listNewProduct,
  updateProduct,
} from "src/controllers/product";
import { isAuth } from "src/middleware/auth";
import fileParser from "src/middleware/fileParser";
import validate from "src/middleware/validator";
import { newProductSchema } from "src/utils/validationSchema";

const productRouter = Router();

productRouter.post(
  "/list",
  isAuth,
  fileParser,
  validate(newProductSchema),
  listNewProduct
);

productRouter.patch(
  "/:id",
  isAuth,
  fileParser,
  validate(newProductSchema),
  updateProduct
);
productRouter.delete("/:id", isAuth, deleteProduct);
productRouter.delete("/image/:productId/:imageId", isAuth, deleteProductImage);
productRouter.get("/detail/:id", getProductDetail);
productRouter.get("/by-category/:category", getProductsByCategory);
productRouter.get("/latest", getLatestProducts);
productRouter.get("/listings", isAuth, getListings);

export default productRouter;
