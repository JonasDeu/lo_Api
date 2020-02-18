const express = require("express")
const router = new express.Router()
const Log = require("../models/log")
const auth = require("../middleware/auth")
const { Parser } = require("json2csv")
const moment = require("moment")

router.get("/logs", auth, async (req, res) => {
    try {
        await req.user.populate("logs", "name owner date numEntries lastEntry").execPopulate();
        res.send(req.user.logs);
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get("/logs/download", auth, async (req, res) => {
    try {
        await req.user.populate("logs", "name owner date numEntries lastEntry entries").execPopulate();

        var data = null
        const fields = ['_id', 'name', 'numEntries', 'owner', 'date', 'lastEntry', 'entries._id', 'entries.time'];
        try {
            const json2csvParser = new Parser({ fields, unwind: "entries", unwindBlank: true });
            data = json2csvParser.parse(JSON.parse(JSON.stringify(req.user.logs)));
        } catch (e) {
            res.status(500).send(e);
        }

        res.setHeader('Content-disposition', 'attachment; filename= yourLogs.csv');
        res.setHeader('Content-Type', 'text/csv')
        res.write(data, function (err) {
            res.end();
        })
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

pearson = (d1, d2) => {
    let { min, pow, sqrt } = Math
    let add = (a, b) => a + b
    let n = min(d1.length, d2.length)
    if (n === 0) {
        return 0
    }
    [d1, d2] = [d1.slice(0, n), d2.slice(0, n)]
    let [sum1, sum2] = [d1, d2].map(l => l.reduce(add))
    let [pow1, pow2] = [d1, d2].map(l => l.reduce((a, b) => a + pow(b, 2), 0))
    let mulSum = d1.map((n, i) => n * d2[i]).reduce(add)
    let dense = sqrt((pow1 - pow(sum1, 2) / n) * (pow2 - pow(sum2, 2) / n))
    if (dense === 0) {
        return 0
    }
    return (mulSum - (sum1 * sum2 / n)) / dense
}

router.get("/logs/correlations/:mode/:time", auth, async (req, res) => {
    const time = parseInt(req.params.time) //Set to param later
    const mode = req.params.mode

    if (!(["day", "hour"].includes(mode))) {
        console.log(mode)
        return res.status(400).send("Mode has to be 'day' or 'hour'!");
    }

    const modes = {
        "day": {
            "inMillisec": 8.64e+7,
            "format": "DD.MM."
        },
        "hour": {
            "inMillisec": 3.6e+6,
            "format": "HH:mm"
        }
    }

    try {
        await req.user.populate("logs", "name entries").execPopulate();

        const curTime = new Date()
        const accumData = req.user.logs.map((log) => {
            var tempData = new Array(time).fill(0)
            log.entries.map((entry) => {
                const tempDate = new Date(moment(entry.time).startOf(mode).toString())
                tempData[Math.ceil((curTime.getTime() - tempDate.getTime()) / modes[mode].inMillisec) - 1] += 1
                return null
            })
            return ([log.name, tempData])
        })

        const matrix = new Array(accumData.length);
        const labels = []
        accumData.forEach((firstEntry, firstIndex) => {
            labels.push(firstEntry[0])
            matrix[firstIndex] = new Array(accumData.length)
            accumData.forEach((secondEntry, secondIndex) => {
                matrix[firstIndex][secondIndex] = pearson(firstEntry[1], secondEntry[1])
            })
        })

        response = {
            labels,
            correlations: matrix
        }

        res.send(response)

    } catch (e) {
        res.status(500).send(e);
    }
})





router.get("/logs/:id?/:mode/:chartSize", auth, async (req, res) => {
    const _id = req.params.id
    const mode = req.params.mode
    const chartSize = parseInt(req.params.chartSize)

    if (!(["day", "hour"].includes(mode))) {
        console.log(mode)
        return res.status(400).send("Mode has to be 'day' or 'hour'!");
    }

    const modes = {
        "day": {
            "inMillisec": 8.64e+7,
            "format": "DD.MM."
        },
        "hour": {
            "inMillisec": 3.6e+6,
            "format": "HH:mm"
        }
    }

    const curTime = new Date()
    const data = new Array(chartSize).fill(0)
    const labels = new Array(chartSize)

    if (_id) {
        try {
            const log = await Log.findOne({ _id, owner: req.user._id });
            if (!log) { return res.status(404).send() }

            log.entries.map((entry) => {
                const tempDate = new Date(moment(entry.time).startOf(mode).toString())
                data[Math.ceil((curTime.getTime() - tempDate.getTime()) / modes[mode].inMillisec) - 1] += 1
                return null
            })

            for (var i = 0; i < labels.length; i++) {
                labels[i] = moment(new Date(curTime.getTime() - (i * modes[mode].inMillisec))).format(modes[mode].format);
            }

            const merge = labels.map((time, index) => {
                return { time, [log.name]: data[index] }
            })

            merge.reverse()
            res.send(merge)
        } catch (e) {
            res.status(500).send(e)
        }

    } else {
        await req.user.populate("logs", "name entries").execPopulate();

        for (var i = 0; i < labels.length; i++) {
            labels[i] = moment(new Date(curTime.getTime() - (i * modes[mode].inMillisec))).format(modes[mode].format);
        }
        const labelsObj = labels.map((time, index) => {
            return { time }
        })

        const accumData = req.user.logs.map((log, index) => {
            var tempData = new Array(chartSize).fill(0)
            log.entries.map((entry, index) => {
                const tempDate = new Date(moment(log.entries[index].time).startOf(mode).toString())
                tempData[Math.ceil((curTime.getTime() - tempDate.getTime()) / modes[mode].inMillisec) - 1] += 1
                return null
            })
            return ([log.name, tempData])

        })

        const accumDataObj = accumData.map((log, logIndex) => {
            const t = log[1].map((entry) => {
                return {
                    [log[0]]: entry
                }
            })
            return t
        })

        const merge = []
        labelsObj.forEach((label, indexLabel) => {
            accumDataObj.forEach((entry, indexEntry) => {
                label = Object.assign(label, entry[indexLabel])
            })
            merge.push(label)

        })

        merge.reverse()
        res.send(merge)
    }

})

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