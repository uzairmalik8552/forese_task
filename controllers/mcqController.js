const MCQ = require("../models/mcq");

const getQuestion = async (req, res) => {
  try {
    const { department, page = 1, sessionId } = req.query;

    // to check if the session idis passed
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

    // validate page number
    if (currentPage < 1 || currentPage > totalPages) {
      return res.status(400).json({
        success: false,
        error: `Invalid page number. Must be between 1 and ${totalPages}`,
      });
    }
    // this is used to paginate
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = Math.min(startIndex + questionsPerPage, totalQuestions);
    // this is used fordecentralized shuffling because of which there will be no duplicate in different page
    // aldo for every session id the ordr will be different
    const userSeed = parseInt(sessionId.replace(/[^0-9]/g, "")) || Date.now();

    // fetch the question based on hash
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
            // this funfion geenerate randome hasvalue using seed value for the retrival of question
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
              // it is also the same as previos funtion
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

    let questionsForThisPage = [];
    // in this we are trying to show the department question fo\irst aand then the apptitude question
    if (startIndex < totalDeptQuestions) {
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
      const aptStart = Math.max(0, startIndex - totalDeptQuestions);
      const aptQuestionsNeeded = questionsPerPage - questionsForThisPage.length;
      questionsForThisPage.push(
        ...aptQuestions.slice(aptStart, aptStart + aptQuestionsNeeded)
      );
    }

    // format questions for response which is retrived
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
