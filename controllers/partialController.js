const UserSearch = require("../models/userSearch");

const partialSearch = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 100, 100);
    const searchQuery = req.query.search?.trim();

    if (!searchQuery) {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }

    // Create case-insensitive regex
    const searchRegex = new RegExp(searchQuery, "i");

    // Optimized query using $or with simple regex
    const query = {
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ],
    };
    console.log("1");
    // Execute search with pagination
    const results = await UserSearch.find(query)
      .select("firstName lastName email ") // Select only needed fields
      .sort({ firstName: 1 }) // Add appropriate sorting
      .skip((page - 1) * limit)
      .limit(limit)

      .lean();
    console.log("2");
    console.log(results);
    // get total count
    // this is taking time to get the response ads it is taking 1m if we inclusde this query
    // i am using this query to mainly get the idea for pagonation
    // we can also skip this query then the rendoring time will be fast and for agination we can hadel it in frontend using tanstack query
    const total = await UserSearch.countDocuments(query);

    const totalPages = Math.ceil(total / limit);
    console.log("3");
    res.status(200).json({
      success: true,
      data: {
        results,
        pagination: {
          currentPage: page,
          totalPages,
          totalResults: total,
          resultsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Error performing search",
      error: error.message,
    });
  }
};

module.exports = { partialSearch };
