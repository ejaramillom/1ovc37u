const mongoose = require("mongoose");

const PageviewSchema = new mongoose.Schema({
  path: { type: String },
  date: { type: String },
  userAgent: { type: String }
});

PageviewSchema.statics.findByPath = function(ruta, cb) {
	return this.countDocuments({ path: new RegExp(ruta, 'i') }, cb);
};

module.exports = mongoose.model("Pageview", PageviewSchema);
