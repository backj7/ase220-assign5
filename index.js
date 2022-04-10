const fs = require('fs');
const exp = require('express');
const bp = require('body-parser');

const app = exp();
const port = 3000;
const endpoint = 'http://localhost:'+port+'/api/';

// Create a directory to store the blobs if one does not already exist
const blobdir = './blobs/';
if (!fs.existsSync(blobdir))
    fs.mkdirSync(blobdir);

app.use(bp.json());

let prevMillis = -1;
let trailing = 1;
function uniqueID() {
    let currMillis = Date.now();
    let id = null;
    if (prevMillis === currMillis) {
        id = '0'.repeat(trailing) + currMillis;
        trailing += 1;
    }
    else {
        id = currMillis;
        trailing = 1;
    }
    prevMillis = currMillis;
    return id;
}

app.use('/', (req, res, next) => {
    console.log('*** REQUEST START ***');
    next();
    console.log('*** REQUEST OVER ***\n');
})

app.use('/api/', (req, res, next) => {
    console.log(`IP : ${req.ip}`);
    console.log(`METHOD : ${req.method}`);
    console.log(`URL : ${req.url}`);
    console.log('BODY :', req.body);
    next();
});

app.post('/api/', (req, res) => {
    let id = uniqueID();
    let jason = JSON.stringify(req.body);
    fs.writeFileSync(blobdir + id + '.json', jason);
    res.setHeader('Content-Location', endpoint+id)
        .setHeader('Content-Type', 'application/json')
        .status(201)
        .send(jason);
});

app.use('/api/:id', (req, res, next) => {
    let path = blobdir + req.params.id + '.json';
    console.log(`Looking for ${path}`);
    if (fs.existsSync(path)) {
        console.log('Found');
        next();
    }
    else {
        console.log('Not found');
        res.status(404).send();
    }
});

app.get('/api/:id', (req, res) => {
    let path = blobdir + req.params.id + '.json';
    console.log(`Reading ${path}`);
    let content = fs.readFileSync(path);
    try {
        parsed = JSON.parse(content);
        if (typeof(parsed) != 'object')
            throw Error('Stored JSON not an object/array');
        res.status(200)
            .setHeader('Content-Type', 'application/json')
            .send(content);
    }
    catch (ex) {
        // This block should never execute unless somebody added a file to /blobs manually
        console.log(`!! Improperly formatted JSON in ${path} !!`);
        res.status(418)
            .send();
    }
});

app.put('/api/:id', (req, res) => {
    let path = blobdir + req.params.id + '.json';
    console.log(`Overriding ${path}`);
    let newJSON = JSON.stringify(req.body);
    fs.writeFileSync(path, newJSON);
    res.status(200)
        .setHeader('Content-Type', 'application/json')
        .send(newJSON);
});

app.delete('/api/:id', (req, res) => {
    let path = blobdir + req.params.id + '.json';
    console.log(`Deleting ${path}`);
    fs.rmSync(path);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});