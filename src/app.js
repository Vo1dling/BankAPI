const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const pathToUsers = path.join(__dirname, "/data/users.json");
app.use(express.json());

app.get("/users", (req, res) => {
  if (fs.existsSync(pathToUsers)) res.sendFile(pathToUsers);
  else res.send("There is no data in the database");
});

app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  fs.readFile(pathToUsers, "utf-8", (err, data) => {
    if (data) {
      const users = err ? [] : JSON.parse(data);
      const currentUser = users.find((user) => user.id === +id);
      if (currentUser) res.send(currentUser);
      else res.send("Couldn't find user");
    } else {
      res.send("There is no data in the database");
    }
  });
});

app.post("/users", (req, res) => {
  const { id = 0, cash = 0, credit = 0 } = req.body;
  const dataBuffer = fs.readFile(pathToUsers, "utf-8");
  const users = JSON.parse(dataBuffer);

  if (users.find((account) => account.id === id)) {
    res.send("User already exists");
  } else {
    if (!id) {
      res.send(`Please specify user id in call
				"id":YOUR-ID`);
    } else {
      const obj = { id, cash, credit };
      users.push(obj);
      fs.writeFile(pathToUsers, JSON.stringify(users));
      res.send(users);
    }
  }
});

app.put("/users/:action/:id", (req, res) => {
  const { id, action } = req.params;
  fs.readFile(pathToUsers, "utf-8", (err, data) => {
    const users = err ? [] : JSON.parse(data);
    const currentUser = users.find((user) => user.id === +id);
    let message = "";
    if (!currentUser) {
      res.send("Couldn't find User");
    } else {
      if (action === "deposit") {
        const { cashToDeposit } = req.body;
        if (cashToDeposit)
          if (cashToDeposit > 0) currentUser.cash += +cashToDeposit;
          else message = "Amount is negative";
      } else if (action === "withdraw") {
        const { cashToWithdraw } = req.body;
        if (cashToWithdraw > 0) {
          if (
            cashToWithdraw > currentUser.cash &&
            cashToWithdraw <= currentUser.cash + currentUser.credit
          ) {
            let cashToWithdrawTemp = +cashToWithdraw;
            cashToWithdrawTemp -= currentUser.cash;
            currentUser.cash = 0;
            currentUser.credit -= cashToWithdrawTemp;
          } else if (cashToWithdraw <= currentUser.cash) {
            currentUser.cash -= +cashToWithdraw;
          } else {
            message = "Not Enough Money in the Account";
          }
        } else message = "Amount is negative";
      } else if (action === "credit") {
        const { newCredit } = req.body;
        if (newCredit)
          if (newCredit > 0) currentUser.credit = +newCredit;
          else message = "Amount is negative";
      } else if (action === "transfer") {
        const { amountToTransfer, targetId } = req.body;
        if (amountToTransfer) {
          if (
            amountToTransfer > currentUser.cash &&
            amountToTransfer <= currentUser.cash + currentUser.credit
          ) {
            let amountToTransferTemp = +amountToTransfer;
            amountToTransferTemp -= currentUser.cash;
            currentUser.cash = 0;
            currentUser.credit -= amountToTransferTemp;
            const targetUser = users.find((user) => user.id === targetId);
            if (targetUser) {
              targetUser.cash += +amountToTransfer;
            } else {
              message = "Can't Find Target User";
            }
          } else if (amountToTransfer <= currentUser.cash) {
            currentUser.cash -= +amountToTransfer;
            const targetUser = users.find((user) => user.id === targetId);
            if (targetUser) {
              targetUser.cash += +amountToTransfer;
            } else {
              message = "Can't Find Target User";
            }
          } else {
            message = "Not Enough Money in the Account";
          }
        }
      }
      fs.writeFile(pathToUsers, JSON.stringify(users), () => {
        if (!message) res.send(users);
        else res.send(message);
      });
    }
  });
});

app.listen("3000", () => {
  console.log("Server Starting Up");
});
