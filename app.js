const express = require("express"); //"^4.13.4"
const exphbs = require("express-handlebars");
const path = require("path");
const aws = require("aws-sdk"); //"^2.2.41"
const bodyParser = require("body-parser");
const multer = require("multer"); // "^1.3.0"
const multerS3 = require("multer-s3"); //"^2.7.0"
const mongoose = require("mongoose");
const Handlebars = require("handlebars");
const paginate = require("handlebars-paginate");
const mongoURIconfig = require("./config/db");
const awsConfig = require("./config/aws");

const {
  allowInsecurePrototypeAccess,
} = require("@handlebars/allow-prototype-access");

const app = express();

const port = process.env.PORT || 5000;

const mongoURI = mongoURIconfig.mongoURI;

//Handlebars Helpers
const { formatDate } = require("./helpers/hbs");

//Map global promise - get rid of warning
mongoose.Promise = global.Promise;

//Connect to mogoose
mongoose
  .connect(mongoURI, {
    //useMongoClient: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("mongodb connected");
  })
  .catch((err) => console.log(err));

//Static folder
app.use(express.static(path.join(__dirname, "public")));

//Handlebars middleware
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main",
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
      formatDate: formatDate,
      paginate: paginate,
    },
  })
);
app.set("view engine", "handlebars");

//Load Image Model

require("./models/Image");
const Image = mongoose.model("image");

aws.config.update(awsConfig);

const s3 = new aws.S3();

app.use(bodyParser.json());

const upload = multer({
  storage: multerS3({
    s3: s3,
    acl: "public-read",
    bucket: "firstopit",
    key: async function (req, file, cb) {
      // console.log(file);
      let date = await Date.now();
      cb(null, date + file.originalname); //use Date.now() for unique file keys
    },
  }),
});

//open http://localhost:3000/ in browser to see upload form
app.get("/", (req, res) => {
  res.render("index");
});

//used by upload form
app.post("/upload", upload.single("upl"), async (req, res, next) => {
  // console.log(req.file.location);

  const imageNew = {
    url: await req.file.location,
    title: req.body.title,
    description: req.body.description,
  };
  console.log(imageNew);
  await new Image(imageNew).save().then((image) => {
    res.redirect("/gallery/1");
  });
});

app.get("/gallery/:page", function (req, res, next) {
  let perPage = 4;
  let page = req.params.page || 1;
  var size = 2;

  Image.find({})
    .sort({ date: "desc" })
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec(function (err, images) {
      Image.count().exec(function (err, count) {
        if (err) return next(err);
        console.log(images);
        res.render("galery", {
          galery: images,
          // size: size,
          pagination: {
            page: page,
            pageCount: Math.ceil(count / perPage),
          },
        });
      });
    });
});

app.get("/gallery", (req, res) => {
  Image.find({})
    .sort({ date: "desc" })
    .then((objGallery) => {
      console.log(objGallery);
      res.render("galery", {
        galery: objGallery,
      });
    });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
