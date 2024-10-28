const Contact = require("../models/Contact");

const search = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || "";
    const skip = (page - 1) * limit;
    // it trim all the withspace before and after the key
    const cleanSearchQuery = searchQuery.trim();
    // it will remove space between the words
    const noSpaceQuery = cleanSearchQuery.replace(/\s+/g, "");
    // it will creat a json that will contain each letter as array of single letter with\\s*
    // this will help us to do partial searching and full text searching
    const finalKey = noSpaceQuery
      .split("")
      .map((char) => `${char}\\s*`)
      .join("");

    const query = {
      $or: [
        { hrName: { $regex: finalKey, $options: "i" } },
        { hrNumber: { $regex: cleanSearchQuery, $options: "i" } },
      ],
    };

    // execute query with pagination
    const hrs = await Contact.find(query)
      .sort({ hrName: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        hrs,
        pagination: {
          currentPage: page,
          totalPages,
          totalResults: total,
          resultsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching HRs",
      error: error.message,
    });
  }
};

const contacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // get contacts with pagination
    const contacts = await Contact.find({}, null, {
      skip: skip,
      limit: limit,
    });

    //  total count on to calculate page
    const totalCount = await Contact.countDocuments();

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: page,
          previousPage: page > 1 ? page - 1 : null,
          nextPage: page * limit < totalCount ? page + 1 : null,
          totalPages: Math.ceil(totalCount / limit),
          totalResults: totalCount,
          resultsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contacts",
      error: error.message,
    });
  }
};

module.exports = { search, contacts };
