const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Record = require("../models/Record");

exports.createRecord = async (req, res) => {
	try {
		const { name, description, category, active } = req.body;

		// Create a new record object
		const newRecord = new Record({
			name,
			description,
			category,
			active,
		});

		// Save the record to the database
		await newRecord.save();

		res.status(201).json({ message: "Record created successfully." });
	} catch (error) {
		console.error("Record creation error:", error);
		res
			.status(500)
			.json({ error: "An error occurred while creating the record." });
	}
};


exports.updateRecord = async (req, res) => {
	try {
	  const { id } = req.params;
	  const { name, description, category, active } = req.body;
  
	  // Find the record by ID in the database
	  const recordToUpdate = await Record.findById(id);
  
	  if (!recordToUpdate) {
		return res.status(404).json({ error: 'Record not found.' });
	  }
  
	  // Update the record properties if provided in the request body
	  if (name) {
		recordToUpdate.name = name;
	  }
	  if (description) {
		recordToUpdate.description = description;
	  }
	  if (category) {
		recordToUpdate.category = category;
	  }
	  if (typeof active === 'boolean') {
		recordToUpdate.active = active;
	  }
  
	  // Save the updated record to the database
	  await recordToUpdate.save();
  
	  res.status(200).json({ message: 'Record updated successfully.', updatedRecord: recordToUpdate });
	} catch (error) {
	  console.error('Record update error:', error);
	  res.status(500).json({ error: 'An error occurred while updating the record.' });
	}
  };

  exports.deleteRecord = async (req, res) => {
	try {
	  const { id } = req.params;
  
	   // Use findByIdAndRemove to delete the record by its ID
	   const deletedRecord = await Record.findByIdAndRemove(id);

	   if (!deletedRecord) {
		 return res.status(404).json({ error: 'Record not found.' });
	   }
   
	   res.status(200).json({ message: 'Record deleted successfully.' });   
	} catch (error) {
	  console.error('Record deletion error:', error);
	  res.status(500).json({ error: 'An error occurred while deleting the record.' });
	}
  };
  
exports.getRecords = async (req, res) => {
	try {
		// Fetch all records from the database
		const records = await Record.find();
		res.status(200).json(records);
	} catch (error) {
		console.error("Error fetching records:", error);
		res
			.status(500)
			.json({ error: "An error occurred while fetching records." });
	}
};

exports.searchByActiveOrNot = async (req, res) => {
	const { isActive, searchName } = req.query;
    try {
      const query = {};
      if (isActive !== undefined) {
        query.active = isActive === "true"; // Convert to boolean
      }
      if (searchName) {
        query.name = { $regex: searchName, $options: "i" }; // Case-insensitive search
      }
  
      const records = await Record.find(query);
      res.json(records);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
}

exports.getRecordByID = async (req, res) => {
	try {
		const recordId = req.params.id;

		// Fetch the record by its unique ID from the database
		const record = await Record.findById(recordId);

		if (!record) {
			return res.status(404).json({ error: "Record not found." });
		}

		res.status(200).json(record);
	} catch (error) {
		console.error("Error fetching record by ID:", error);
		res
			.status(500)
			.json({ error: "An error occurred while fetching the record." });
	}
};
