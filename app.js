const express = require("express");
const app = express();
const mongoose = require("mongoose");
const schema = mongoose.Schema;

const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.Promise = global.Promise;
mongoose.connect(MONGODB_URI);

mongoose.connection
  .once("open", () => {
    console.log("connected to db");
  })
  .on("error", () => {
    console.log("error occured when connecting");
  });

const urlShortenerSchema = new schema({
  id: String,
  url: String,
  shortenedUrl: String
});

let urlShortener = mongoose.model("urls", urlShortenerSchema);

const regexUrl = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;

app.get("/", function(req, res) {
  res.send(__dirname + "/README.md");
});

app.get("/:redirectUrl", function(req, res) {
  urlShortener.findOne({ shortenedUrl: req.params.redirectUrl }, function(
    err,
    data
  ) {
    if (err) throw err;
    if (data) {
      res.redirect(data.url);
    }
  });
});

app.get("/new/*", function(req, res) {
  let userUrl = req.params[0];

  if (regexUrl.test(userUrl)) {
    // silly me here trying to make it a little long :)
    let size = 52975;

    urlShortener
      .find({}, function(err, data) {
        if (err) throw err;
        let dbSize = data.reduce((acc, elem) => {
          return acc + 1;
        }, 0);
        size += dbSize;
      })
      .then(
        () => {
          let urlId = size.toString();
          let shortUrl = convertBase(urlId, 10, 62);

          let data = urlShortener({
            id: urlId,
            url: userUrl,
            shortenedUrl: shortUrl
          }).save(function(err, data) {
            if (err) throw err;
            console.log("url saved");
          });
          res.send(
            JSON.stringify({
              original_url: userUrl,
              short_url: req.hostname + "/" + shortUrl
            })
          );
        },
        err => {
          console.log("err occurred");
        }
      );
  } else {
    res.send("Invalid Url");
  }
});

function convertBase(value, from_base, to_base) {
  var range = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split(
    ""
  );
  var from_range = range.slice(0, from_base);
  var to_range = range.slice(0, to_base);

  var dec_value = value
    .split("")
    .reverse()
    .reduce(function(carry, digit, index) {
      if (from_range.indexOf(digit) === -1)
        throw new Error(
          "Invalid digit `" + digit + "` for base " + from_base + "."
        );
      return (carry += from_range.indexOf(digit) * Math.pow(from_base, index));
    }, 0);

  var new_value = "";
  while (dec_value > 0) {
    new_value = to_range[dec_value % to_base] + new_value;
    dec_value = (dec_value - dec_value % to_base) / to_base;
  }
  return new_value || "0";
}

let listener = app.listen(port, () => {
  console.log(`listening at port ${port}`);
});
