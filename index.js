const express = require("express");
const connectDB = require("./config/db");
const mcqRoutes = require("./routes/mcqRoutes");
const partialRoute = require("./routes/partialRoute");
const contact = require("./routes/contactRouts");
const app = express();
const PORT = 3000;

app.use(express.json());

// Connect to MongoDB
connectDB();

// route for mcq retrival
app.use("/mcq", mcqRoutes);

// route for partial search
app.use("/partial", partialRoute);

app.use("/contact", contact);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
