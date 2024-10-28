const Contact = require("../models/Contact");

const search = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || "";
    const skip = (page - 1) * limit;

    // Clean and prepare the search query
    const cleanSearchQuery = searchQuery.trim();

    // Remove all spaces and escape special
    const noSpaceQuery = cleanSearchQuery.replace(/\s+/g, "");

    const regexPattern = noSpaceQuery
      .split("")
      .map((char) => `${char}\\s*`)
      .join("");

    const query = {
      $or: [
        { hrName: { $regex: regexPattern, $options: "i" } },
        { hrNumber: { $regex: cleanSearchQuery, $options: "i" } },
      ],
    };

    // Execute query with pagination
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

    // Get contacts with pagination
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
