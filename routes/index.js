const express = require("express");

const router = express.Router();

//Rutas
//const sample = require("./sample");
const CharactersMarvel = require("./CharactersMarvelRoutes");

//Rutas de prueba
//router.use("/sample", sample);
//Rutas Juan
router.use("/api/v1/marvel/chars", CharactersMarvel);

//Rutas por defecto
router.get("*", (req, res) => {
  res.json({
    status: 404,
    msg: "Endpoint Not Found",
  });
});

module.exports = router;