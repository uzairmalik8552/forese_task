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

    // Create compound index for these fields if not already created
    // await UserSearch.collection.createIndex({
    //   firstName: 1,
    //   lastName: 1,
    //   email: 1
    // });

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
    // Get total count
    // const total = await UserSearch.countDocuments(query);
    const total = await UserSearch.aggregate([
      { $match: query },
      { $count: "total" },
    ]);
    const totalCount = total[0] ? total[0].total : 0;

    const totalPages = Math.ceil(totalCount / limit);
    console.log("3");
    res.status(200).json({
      success: true,
      data: {
        results,
        pagination: {
          currentPage: page,
          totalPages,
          totalResults: totalCount,
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
