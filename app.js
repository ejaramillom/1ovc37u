const express = require("express");
const mongoose = require("mongoose");
const Note = require("./models/Note");
const Pageview = require("./models/Pageview");
const path = require('path');
const md = require('marked');

const app = express();

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/notes', { useNewUrlParser: true });

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// let page_visits = {};
// let visits = (req, res, next) => {
//   let counter = 0 || page_visits[req.originalUrl];
//   console.log(counter)
//   if(counter || counter === 0)
//     page_visits[req.originalUrl] = counter + 1;
//   else
//     page_visits[req.originalUrl] = 0;
//   console.log("ruta: " + req.originalUrl, "contador: " + counter);
//   next();
// };

let getRoute = (req) => {
   const route = req.route ? req.route.path : '' // check if the handler exist
   const baseUrl = req.baseUrl ? req.baseUrl : '' // adding the base url if the handler is a child of another handler

   return route ? `${baseUrl === '/' ? '' : baseUrl}${route}` : 'unknown route'
 }

app.use(async(req, res, next) => {

    if (req.method == "GET") {
      const data = {
        path: req.originalUrl,
        date: new Date(),
        userAgent: req.get('User-Agent')
      };

      try {
        const pageview = new Pageview(data);
        await pageview.save();
        console.log("Registro añadido a la base de datos pageview");
      } catch(e) {
        return next(e);
      }
    }

   next()
})



app.get("/analytics", async(req, res, next) => {
  const pageviews = await Pageview.aggregate().group({ _id: "$path", count: {$sum: 1}});
  // array_conteo = []
  // const conteo = pageviews.forEach( route => {
  //   Pageview.countDocuments({ path: route}, function(err, count){
  //     if (err) return handleError(err);
  //     array_conteo.push(count)
  //     //console.log(array_conteo);
  //   });
  // });

  res.render("analytics" , {arr: pageviews})
  console.log(pageviews)

  // let arr = [];
  // // Defino el array de las listas unicas de GET
  // const pageviews = await Pageview.collection.distinct("path");

  //  var bar = new Promise((resolve, reject)=>{
  //   pageviews.forEach((route) =>{
  //     let c = Pageview.findByPath(route =>{
  //       resolve()
  //     })
  //     arr.push({path: route, conteo: c});
  //   })
  // });

  //  bar.then(() => {
  //   console.log(arr);
  //  });

   /* MEdio funcionando
     var bar = new Promise((resolve, reject)=>{
      pageviews.forEach((route) =>{
        Pageview.findByPath(route, function(err,c) {
          arr.push({path: route, conteo: c});
          resolve();
        });
      })
    });
     bar.then(() => {
      console.log(arr);
     });
   */

});

app.get("/", async (req, res) => {
  const notes = await Note.find();
  res.render("index",{ notes: notes } )
});

app.get("/notes/new",  async (req, res) => {
  const notes = await Note.find();
  res.render("new", { notes: notes });
});

app.post("/notes", async (req, res, next) => {
  const data = {
    title: req.body.title,
    body: req.body.body
  };

  const note = new Note(req.body);
  try {
    await note.save();
  } catch (e) {
    return next(e);
  }

  res.redirect('/');
});

app.get("/notes/:id", async (req, res) => {
  const notes = await Note.find();
  const note = await Note.findById(req.params.id);
  res.render("show", { notes: notes, currentNote: note, md: md });
});

app.get("/notes/:id/edit", async (req, res, next) => {
  const notes = await Note.find();
  const note = await Note.findById(req.params.id);
  res.render("edit", { notes: notes, currentNote: note });
});

app.patch("/notes/:id", async (req, res) => {
  const id = req.params.id;
  const note = await Note.findById(id);

  note.title = req.body.title;
  note.body = req.body.body;

  try {
    await note.save();
  } catch (e) {
    return next(e);
  }

  res.status(204).send({});
});

app.delete("/notes/:id", async (req, res) => {
  await Note.deleteOne({ _id: req.params.id });
  res.status(204).send({});
});

app.listen(3000, () => console.log("Listening on port 3000 ..."));
