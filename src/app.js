const express = require("express");
const app = express();
const cors = require("cors");
const routes = require("./Routes/index");
const cron = require("node-cron");
const executeScriptAmazon = require("./Scrapers/Amazon");
const executeScriptKabum = require("./Scrapers/Kabum");

const port = 3002;

cron.schedule("0 7 * * *", () => {
  executeScriptAmazon();
  executeScriptKabum();
});
app.use(express.json());
app.use(cors());
app.use(routes);

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port} 🔥`);
});
