const express = require("express")
const router = new express.Router()
const Log = require("../models/log")
const auth = require("../middleware/auth")


router.get("/logs", auth, async (req, res) => {
    try {
        await req.user.populate("logs", "name owner date numEntries lastEntry").execPopulate();
        res.send(req.user.logs);
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get("/logs/:id", auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const log = await Log.findOne({ _id, owner: req.user._id });
        if (!log) {
            return res.status(404).send();
        }
        res.send(log);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.post("/logs", auth, async (req, res) => {
    const log = new Log({
        ...req.body,
        owner: req.user._id
    })
    try {
        await log.save()
        res.status(201).send(log)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post("/logs/:id", auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const log = await Log.findOne({ _id, owner: req.user._id });
        if (!log) {
            return res.status(404).send();
        }

        var logEntry = await { time: Date.now() };
        log.entries.push(logEntry);
        log.numEntries++
        log.lastEntry = Date.now()
        await log.save()

        res.status(201).send(log)

    } catch (e) {
        res.status(400).send(e);
    }
})

router.delete("/logs/:id", auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const log = await Log.findOneAndDelete({ _id, owner: req.user._id });
        if (!log) {
            return res.status(404).send();
        }
        res.send(log);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.delete("/logs/:idLog/:idEntry", auth, async (req, res) => {
    const _idLog = req.params.idLog;
    const _idEntry = req.params.idEntry;

    try {
        const log = await Log.findOne({ _id: _idLog, owner: req.user._id });
        if (!log) {
            return res.status(404).send();
        }

        logEntry = await log.entries.id(_idEntry).remove();
        if (!logEntry) {
            return res.status(404).send();
        }
        log.numEntries++
        await log.save()

        res.send(log);

    } catch (e) {
        res.status(400).send(e);
    }
})

module.exports = router