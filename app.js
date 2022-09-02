const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");
module.exports = app;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running....");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//Registering new User
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser !== undefined) {
    response.status = 400;
    response.send("User already exists");
  } else {
    const len = password.length;
    if (len < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const createUserQuery = `INSERT INTO user(username,name,password,gender,location)  VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(createUserQuery);
      response.status = 200;
      response.send("User created successfully");
    }
  }
});

//Login the User
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const user = await db.get(selectUserQuery);
  if (user === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (isPasswordMatched === true) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

//Updating the password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  const isCurrentPasswordMatched = await bcrypt.compare(
    oldPassword,
    dbUser.password
  );
  if (isCurrentPasswordMatched === true) {
    const len = newPassword.length;
    if (len < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const updatePasswordQuery = `UPDATE user SET password='${newHashedPassword}' WHERE username='${username}';`;
      await db.run(updatePasswordQuery);
      response.status = 200;
      response.send("Password updated");
    }
  } else {
    response.status = 400;
    response.send("Invalid current password");
  }
});
