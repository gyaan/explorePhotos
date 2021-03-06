  var LocalStrategy = require('passport-local').Strategy;
  var bCrypt = require('bcrypt-nodejs');
  var http = require("http");
  var querystring = require('querystring');
  //temporary data store
  var users = {};
  module.exports = function(passport) {

    // Passport needs to be able to serialize and deserialize users to support persistent login sessions
    passport.serializeUser(function(user, done) {
      console.log('serializing user:', user.Username);
      return done(null, user.Username);
    });

    passport.deserializeUser(function(username, done) {

      console.log("deserialize the user");
      //get the user details using apis 
      var options = {
        host: "localhost",
        port: "1334",
        path: "/users?username=" + username,
        method: "GET",
      }

      var request = http.request(options, function(ress) {
        var buffer = "",
          output;
        ress.on("data", function(chunk) {
          buffer += chunk;
        });

        ress.on("end", function(err) {
          output = JSON.parse(buffer);
          if (output.Status == "success") {
            console.log(output);
            return done(null, output.User);
          } else {
            return done(null, false)
          }
        });
      });

      request.on('error', function(e) {
        console.log('problem with request: ' + e.message);
      });


      // write data to request body
      // request.write(output);
      request.end();

    });

    passport.use('login', new LocalStrategy({
        passReqToCallback: true
      },
      function(req, username, password, done) {


        var data = querystring.stringify({
          'username': username,
          'password': password
        });

        console.log(data);

        var options = {
          host: "localhost",
          port: "1334",
          path: "/login",
          method: "POST",
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
          }
        }

        var request = http.request(options, function(ress) {
          var buffer = "",
            output;
          ress.on("data", function(chunk) {
            buffer += chunk;
          });

          ress.on("end", function(err) {
            output = JSON.parse(buffer);
            if (output.Status == "success") { //user is already exist 
              console.log(output.User);
              return done(null, output.User);
            } else {
              return done(null, false)
            }
          });
        });

        request.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });

        // write data to request body
        request.write(data);
        request.end();
      }
    ));

    passport.use('signup', new LocalStrategy({
        passReqToCallback: true // allows us to pass back the entire request to the callback
      },
      function(req, username, password, done) {

        var data = querystring.stringify({
          'username': username,
          'password': password
        });

        console.log(data);

        var options = {
          host: "localhost",
          port: "1334",
          path: "/users",
          method: "POST",
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
          }
        }

        var request = http.request(options, function(ress) {
          var buffer = "",
            output;
          ress.on("data", function(chunk) {
            buffer += chunk;
          });

          ress.on("end", function(err) {
            output = JSON.parse(buffer);
            if (output.Status == "success") { //user is already exist 
              console.log(output.User);
              return done(null, output.User);
            } else {
              return done(null, false)
            }
          });
        });

        request.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });


        // write data to request body
        request.write(data);
        request.end();

      }));

    var isValidPassword = function(user, password) {
      return bCrypt.compareSync(password, user.password);
    };
    // Generates hash using bCrypt
    var createHash = function(password) {
      return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };

  };