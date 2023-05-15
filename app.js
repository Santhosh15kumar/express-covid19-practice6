const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = ` 
    SELECT 
      * 
    FROM 
      state;`;
  const states = await database.all(getStatesQuery);
  response.send(states);
});

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
      * 
    FROM 
     State 
    WHERE 
     state_id = '${stateId}';`;

  const state = await database.get(getStateQuery);
  response.send(state);
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `
    INSERT INTO 
      DISTRICT(district_name,stateId,cases,cured,active,deaths)
    VALUES ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;

  const addDistrict = database.run(addDistrictQuery);
  const district_id = addDistrict.lastId;
  response.send("District Successfully Added");
});

app.get("/districts/:district_id", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = ` 
    SELECT 
      * 
    FROM 
     District 
    WHERE 
     district_id = '${districtId}';`;

  const district = await database.get(getDistrictQuery);
  response.send(district);
});

app.delete("/districts/:/district_id", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM 
    DISTRICT 
    WHERE district_id = '${districtId}';`;
});

app.put("/districts/:/district_id", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = ` 
    UPDATE 
      District 
    SET 
      district_name = '${districtName}',
      state_id = '${stateId}',
      cases = '${cases},
      cured = '${cured},
      active = '${active},
      deaths = '${deaths} 
      
    WHERE 
      district_id = '${districtId}';`;

  const updatedDistrict = await database.run(updatedDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:/stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  const getStateStats = `
    SELECT 
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths) 
    FROM 
     State 
    WHERE 
     state_id = '${stateId};`;

  const stateStats = await database.get(getStateStats);
  response.send({
    totalCases: stateStats["SUM(cases)"],
    totalCured: stateStats["SUM(cured)"],
    totalActive: stateStats["SUM(active)"],
    totalDeath: stateStats["SUM(deaths)"],
  });
});

app.get("/district/:/districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT 
      state_name 
    FROM 
      DISTRICT 
    NATURAL JOIN 
      STATE 
    WHERE 
      district_id = '${districtId}';`;

  const state = await database.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
