const Category = require("../models/Category");

exports.get = async (req, res, next) => {
    try {
		const categories = await Category.find({}, "name");
		res.json(categories);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
}

exports.post = async (req, res, next) => {
    const { name } = req.body;
	try {
		const category = new Category({ name });
		await category.save();
		res.status(201).json(category);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
}