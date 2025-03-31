const express = require('express');
const responseTime = require('response-time');
const client = require('prom-client'); // Metric Collection



const app = express();
const PORT = 8000;

const defaultClientMetrics = client.collectDefaultMetrics;

defaultClientMetrics({register : client.register});
const reqResTime  = new client.Histogram({
    name : "http_express_req_res_time",
    help : "Time Taken by Req an Response",
    labelNames : ['method','route','status_code'],
    buckets : [1,50,100,200,400,500,800,1000,2000]
});

const totalReqCounter = new client.Counter({
    name : "total_requests",
    help : "Total Requests",
    labelNames : ['route']
})

app.use(responseTime((req,res,time)=>{
    totalReqCounter.inc();
    totalReqCounter.labels({route : req.url});
    reqResTime.labels({method : req.method, route : req.url, status_code : res.status_code}).observe(time);
}
));

app.get('/',async( req , res)=>{
    res.send("Hi");
    logger.info("Req Came on /");
});

app.get('/slow',async (req,res)=>{
    try{
        return res.json("HII");
    }   
    catch(e){   
        console.log("Error in SLow API",e);
        return res.status(500).json({status : "Error",e : "Internal Server Errror"}); 
    }
});

app.get('/metrics',async (req,res)=>{
    res.setHeader('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
})

app.listen(PORT , ()=>{
    console.log("Server Start on PORT", PORT);
})

