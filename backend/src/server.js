const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const carRoutes = require("./routes/carRoutes");
const employeeRoutes = require("./routes/employeeRoutes")
const driverRoutes = require("./routes/driverRoutes")
const bindingRoutes = require("./routes/carDriverBindingRoutes")
const authRoutes = require("./routes/authRoutes")
const registrationRoutes = require("./routes/registrationRoutes");
const performanceRoutes = require("./routes/performanceRoutes"); 
const workRulesRoutes = require("./routes/workRulesRoutes");
const optionsRoutes = require("./routes/optionsRoutes");
const teamLeaderCountRoutes = require("./routes/teamLeaderCountRoutes")
const app = express();

app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get("/", (req, res) => {
  res.json({
    message: "Yango Car Management API is running",
  });
});

//app.use("/api/cars", carRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/bindings", bindingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/work-rules", workRulesRoutes); 
app.use("/api/options", optionsRoutes);
app.use("/api/team-leader-counts", teamLeaderCountRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});