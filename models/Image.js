const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create Schema
const ImageSchema = new Schema({
  url: {
    type: String
  },
  title: {
    type: String
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

mongoose.model("image", ImageSchema);
