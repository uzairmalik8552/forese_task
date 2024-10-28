const MCQ = require("../models/mcq");

// const getQuestion = async (req, res) => {
//   try {
//     const { department, page = 1 } = req.query;
//     const questionsPerPage = 5;
//     const currentPage = parseInt(page);
//     const totalDeptQuestions = 20;
//     const totalAptQuestions = 30;
//     const totalQuestions = totalDeptQuestions + totalAptQuestions;
//     const totalPages = Math.ceil(totalQuestions / questionsPerPage);

//     // Validate page number
//     if (currentPage < 1 || currentPage > totalPages) {
//       return res.status(400).json({
//         success: false,
//         error: `Invalid page number. Must be between 1 and ${totalPages}`,
//       });
//     }

//     const startIndex = (currentPage - 1) * questionsPerPage;
//     const endIndex = Math.min(startIndex + questionsPerPage, totalQuestions);

//     // Get all questions first
//     const [deptQuestions, aptQuestions] = await Promise.all([
//       // Get department questions
//       MCQ.find({
//         category: "department",
//         department: department,
//       })
//         .select("question options category department")
//         .sort({ _id: 1 })
//         .lean()
//         .exec(),

//       // Get aptitude questions
//       MCQ.find({
//         category: "aptitude",
//       })
//         .select("question options category")
//         .sort({ _id: 1 })
//         .lean()
//         .exec(),
//     ]);

//     // Generate a deterministic shuffle based on the daily seed
//     const dailySeed = new Date().toISOString().split("T")[0];

//     function shuffleArray(array, seed) {
//       const shuffled = [...array];
//       let currentIndex = shuffled.length;
//       let temporaryValue, randomIndex;

//       // Create a seeded random number generator
//       const random = () => {
//         const x = Math.sin(seed++) * 10000;
//         return x - Math.floor(x);
//       };

//       // While there remain elements to shuffle
//       while (0 !== currentIndex) {
//         // Pick a remaining element
//         randomIndex = Math.floor(random() * currentIndex);
//         currentIndex -= 1;

//         // Swap it with the current element
//         temporaryValue = shuffled[currentIndex];
//         shuffled[currentIndex] = shuffled[randomIndex];
//         shuffled[randomIndex] = temporaryValue;
//       }

//       return shuffled;
//     }

//     // Create deterministic shuffled arrays that will remain consistent throughout the day
//     const seedNum = parseInt(dailySeed.replace(/-/g, ""));
//     const shuffledDeptQuestions = shuffleArray(deptQuestions, seedNum);
//     const shuffledAptQuestions = shuffleArray(aptQuestions, seedNum + 1); // Different seed for apt questions

//     // Combine questions in the right order based on pagination
//     let questionsForThisPage = [];

//     if (startIndex < totalDeptQuestions) {
//       const deptStart = startIndex;
//       const deptEnd = Math.min(
//         startIndex + questionsPerPage,
//         totalDeptQuestions
//       );
//       questionsForThisPage.push(
//         ...shuffledDeptQuestions.slice(deptStart, deptEnd)
//       );
//     }

//     if (
//       questionsForThisPage.length < questionsPerPage &&
//       endIndex > totalDeptQuestions
//     ) {
//       const aptStart = Math.max(0, startIndex - totalDeptQuestions);
//       const aptQuestionsNeeded = questionsPerPage - questionsForThisPage.length;
//       questionsForThisPage.push(
//         ...shuffledAptQuestions.slice(aptStart, aptStart + aptQuestionsNeeded)
//       );
//     }

//     const formattedQuestions = questionsForThisPage.map((q) => ({
//       id: q._id,
//       question: q.question,
//       options: q.options,
//       category: q.category,
//       department: q.department || null,
//     }));

//     res.json({
//       success: true,
//       data: {
//         questions: formattedQuestions,
//         pagination: {
//           currentPage,
//           totalPages,
//           questionsPerPage,
//           totalQuestions,
//           departmentQuestions: totalDeptQuestions,
//           aptitudeQuestions: totalAptQuestions,
//           questionsInThisPage: formattedQuestions.length,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching questions:", error);
//     res.status(500).json({
//       success: false,
//       error: "Internal server error",
//       message: error.message,
//     });
//   }
// };

const getQuestion = async (req, res) => {
  try {
    const { department = "CSE", page = 1, sessionId } = req.query;

    // Validate session ID
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "sessionId is required for consistent pagination",
      });
    }

    const questionsPerPage = 5;
    const currentPage = parseInt(page);
    const totalDeptQuestions = 20;
    const totalAptQuestions = 30;
    const totalQuestions = totalDeptQuestions + totalAptQuestions;
    const totalPages = Math.ceil(totalQuestions / questionsPerPage);

    // Validate page number
    if (currentPage < 1 || currentPage > totalPages) {
      return res.status(400).json({
        success: false,
        error: `Invalid page number. Must be between 1 and ${totalPages}`,
      });
    }

    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = Math.min(startIndex + questionsPerPage, totalQuestions);

    // Use session ID to create a unique but consistent order for each user
    const userSeed = parseInt(sessionId.replace(/[^0-9]/g, "")) || Date.now();

    // Fetch all questions at once with proper indexing
    const [deptQuestions, aptQuestions] = await Promise.all([
      MCQ.aggregate([
        {
          $match: {
            category: "department",
            department: department,
          },
        },
        {
          $addFields: {
            // Create a random sort value that's consistent for this user's session
            sortOrder: {
              $function: {
                body: `function(id, seed) {
                  const str = id.toString() + seed.toString();
                  let hash = 0;
                  for (let i = 0; i < str.length; i++) {
                    hash = ((hash << 5) - hash) + str.charCodeAt(i);
                    hash = hash & hash;
                  }
                  return hash;
                }`,
                args: ["$_id", userSeed],
                lang: "js",
              },
            },
          },
        },
        { $sort: { sortOrder: 1 } },
        { $limit: totalDeptQuestions },
      ]),

      MCQ.aggregate([
        {
          $match: {
            category: "aptitude",
          },
        },
        {
          $addFields: {
            sortOrder: {
              $function: {
                body: `function(id, seed) {
                  const str = id.toString() + seed.toString();
                  let hash = 0;
                  for (let i = 0; i < str.length; i++) {
                    hash = ((hash << 5) - hash) + str.charCodeAt(i);
                    hash = hash & hash;
                  }
                  return hash;
                }`,
                args: ["$_id", userSeed + 1],
                lang: "js",
              },
            },
          },
        },
        { $sort: { sortOrder: 1 } },
        { $limit: totalAptQuestions },
      ]),
    ]);

    // Combine questions based on pagination
    let questionsForThisPage = [];

    if (startIndex < totalDeptQuestions) {
      // Add department questions
      const deptStart = startIndex;
      const deptEnd = Math.min(
        startIndex + questionsPerPage,
        totalDeptQuestions
      );
      questionsForThisPage.push(...deptQuestions.slice(deptStart, deptEnd));
    }

    if (
      questionsForThisPage.length < questionsPerPage &&
      endIndex > totalDeptQuestions
    ) {
      // Add aptitude questions if needed
      const aptStart = Math.max(0, startIndex - totalDeptQuestions);
      const aptQuestionsNeeded = questionsPerPage - questionsForThisPage.length;
      questionsForThisPage.push(
        ...aptQuestions.slice(aptStart, aptStart + aptQuestionsNeeded)
      );
    }

    // Format questions for response
    const formattedQuestions = questionsForThisPage.map((q) => ({
      id: q._id,
      question: q.question,
      options: q.options,
      category: q.category,
      department: q.department || null,
    }));

    res.json({
      success: true,
      data: {
        questions: formattedQuestions,
        pagination: {
          currentPage,
          totalPages,
          questionsPerPage,
          totalQuestions,
          departmentQuestions: totalDeptQuestions,
          aptitudeQuestions: totalAptQuestions,
          questionsInThisPage: formattedQuestions.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};

module.exports = { getQuestion };
