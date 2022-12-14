const express = require("express");
const Express = express();
Express.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    Express.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
const convertStateToDistrict = (objectDb) => {
  return {
    stateName: objectDb.district_name,
  };
};

Express.get("/states/", async (request, response) => {
  const movieName = request.params;
  const movieQuery = `select * from state `;
  const movieNameQuery = await db.all(movieQuery);
  response.send(
    movieNameQuery.map((eachName) => convertDbObjectToResponseObject(eachName))
  );
});

Express.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getMovieDetailQuery = `select * from state where state_id = ${stateId}`;
  const movieDbResponse = await db.get(getMovieDetailQuery);
  response.send(convertDbObjectToResponseObject(movieDbResponse));
});

Express.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postPlayerQuery = `
  INSERT INTO
    district (district_name, state_id, cases, cured, active, deaths)
  VALUES
    ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths})`;
  const player = await db.run(postPlayerQuery);
  response.send("District Successfully Added");
});

Express.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailQuery = `select * from district where district_id = ${districtId}`;
  const districtDbResponse = await db.get(getDistrictDetailQuery);
  response.send(convertDbObjectToResponseObject(districtDbResponse));
});

Express.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailQuery = `delete from district where district_id = ${districtId}`;
  const districtDbResponse = await db.get(getDistrictDetailQuery);
  response.send("District Removed");
});

Express.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postPlayerQuery = `
  update
    district
  set
    district_name = '${districtName}', 
    state_id = ${stateId}, 
    cases = ${cases}, 
    cured = ${cured}, 
    active = ${active}, 
    deaths = ${deaths}
    where 
        district_id = ${districtId}`;
  const player = await db.run(postPlayerQuery);
  response.send("District Details Updated");
});
Express.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getMovieDetailQuery = `select sum(cases) as totalCases, sum(cured) as totalCured, sum(active) as totalActive, sum(deaths) as totalDeaths from district where state_id = ${stateId}`;
  const movieDbResponse = await db.get(getMovieDetailQuery);
  response.send(movieDbResponse);
});

Express.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getMovieDetailQuery = `SELECT 
    state.state_name
  FROM 
    district INNER JOIN state ON state.state_id=district.state_id
  WHERE 
    district_id=${districtId};`;
  const movieDbResponse = await db.get(getMovieDetailQuery);
  response.send(convertDbObjectToResponseObject(movieDbResponse));
});
module.exports = Express;
