const express = require("express");
const satelize = require("satelize-lts");
const MissionService = require("../services/mission.service");

const router = express.Router();
const service = new MissionService();

router.get("/", async (req, res, next) => {
  try {
    await service.updateAttempts();
    const missions = await service.find();
    return res.status(200).json(missions).end();
  } catch (error) {
    next(error);
  }
});

router.get("/:name", async (req, res, next) => {
  try {
    const { name } = req.params;
    await service.updateAttempts();
    const mission = await service.findByName(name);
    if (!mission) return res.status(404).send("Mission not found").end();
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

router.post("/start", async (req, res, next) => {
  try {
    const { missionName, ip } = req.body;

    // Check if mission exists
    const mission = await service.findByName(missionName);
    if (!mission) {
      console.log(
        `🟠 Mission "${missionName}" has not been registered in the system`
      );
      return res.status(404).send("Mission not found").end();
    }

    // Get origin IP
    let country_code = "Unknown";

    satelize.satelize({ ip: ip }, (err, payload) => {
      console.log(payload);
      country_code = payload.country_code;
    });

    let origin = mission.origins.find((o) => o.country === country_code);
    if (!origin) {
      origin = { country: country_code, count: 1 };
      mission.origins.push(origin);
    }
    origin.count++;

    // Update attempts made
    mission.attemptsMade++;

    // Update mission data
    console.log(`🟢 Mission start registered: ${mission}`);
    await service.update(mission.id, mission);
    await service.updateAttempts();
    res.json(mission);
  } catch (error) {
    next(error);
  }
});

router.post("/finish", async (req, res, next) => {
  try {
    const { missionName, errors } = req.body;

    // Check if mission exists
    const mission = await service.findByName(missionName);
    if (!mission) {
      console.log(
        `🟠 Mission "${missionName}" has not been registered in the system`
      );
      return res.status(404).send("Mission not found").end();
    }

    // Update attempts completed
    mission.attemptsCompleted++;

    // Add the errors
    mission.errors += parseInt(errors, 10);

    // Update mission data
    console.log(`🟢 Mission finish registered: ${mission}`);
    await service.update(mission.id, mission);
    await service.updateAttempts();

    res.json(mission);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await service.delete(id);
    res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
