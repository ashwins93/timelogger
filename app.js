var express     = require('express')
  , app         = express()
  , mongoose    = require('mongoose')
  , bodyParser  = require('body-parser')
;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

app.get("/", function(req, res) {
    res.render("index");
});

app.post("/", function(req, res) {
    res.send("Hello " + req.body.username);
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Server running in the port: " + (process.env.PORT || 3000));
});