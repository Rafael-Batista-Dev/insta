var express = require("express");
bodyParser = require("body-parser");
mongodb = require("mongodb");
objectId = require("mongodb").ObjectId;
multiparty = require('connect-multiparty');
fs = require('fs');

var app = express();

//body-paser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiparty());

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  next();
});
var port = 8080;

app.listen(port);

var db = new mongodb.Db(
  "instagram",
  new mongodb.Server(
    "localhost", //string contendo o endereço do servidor
    27017, //porta de conex;ão
    {}
  ),
  {}
);

app.get("/", function (req, res) {
  res.send({ msg: "Olá" });
});

//POST
app.post("/api", function (req, res) {
  var date = new Date();
  time_stamp = date.getTime();

  var url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;
  var path_origem = req.files.arquivo.path;
  var path_destino = './uploads/' + url_imagem;


  fs.rename(path_origem, path_destino, function (err) {
    if (err) {
      res.status(500).json({ error: err });
      return;
    }

    var dados = {
      url_imagem: url_imagem,
      titulo: req.body.titulo
    }

    db.open(function (err, mongoclient) {
      mongoclient.collection("postagens", function (err, collection) {
        collection.insert(dados, function (err, records) {
          if (err) {
            res.json({ status: "err" });
          } else {
            res.json({ status: "insclusao realizada comsucesso" });
          }
          mongoclient.close();
        });
      });
    });
  })
});

//GET
app.get("/api", function (req, res) {
  db.open(function (err, mongoclient) {
    mongoclient.collection("postagens", function (err, collection) {
      collection.find().toArray(function (err, results) {
        if (err) {
          res.json(err);
        } else {
          res.json(results);
        }
        mongoclient.close();
      });
    });
  });
});

//GET por ID
app.get("/api/:id", function (req, res) {
  db.open(function (err, mongoclient) {
    mongoclient.collection("postagens", function (err, collection) {
      collection.find(objectId(req.params.id)).toArray(function (err, results) {
        if (err) {
          res.json(err);
        } else {
          res.json(results);
        }
        mongoclient.close();
      });
    });
  });
});

app.get('/imagens/:imagem', function (req, res) {
  var img = req.params.imagem;
  fs.readFile('./uploads/' + img, function (err, content) {
    if (err) {
      res.status(400).json(err);
      return;
    }
    res.writeHead(200, { 'content-type': 'image/jpe' });
    res.end(content);
  })
})

//PUT update por ID
app.put("/api/:id", function (req, res) {
  db.open(function (err, mongoclient) {
    mongoclient.collection("postagens", function (err, collection) {
      collection.update(
        { _id: objectId(req.params.id) },
        {
          $push:
          {
            comentarios: {
              id_comentario: new objectId(),
              comentario: req.body.comentario
            }
          }

        },
        {},
        function (err, records) {
          if (err) {
            res.json(err);
          } else {
            res.json(records);
          }
          mongoclient.close();
        }
      );
    });
  });
});

//DELETE por id
app.delete("/api/:id", function (req, res) {
  db.open(function (err, mongoclient) {
    mongoclient.collection("postagens", function (err, collection) {
      collection.remove({ _id: objectId(req.params.id) }, function (
        err,
        records
      ) {
        if (err) {
          res.json(err);
        } else {
          res.json(records);
        }
        mongoclient.close();
      });
    });
  });
});
