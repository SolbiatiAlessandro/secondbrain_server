import { GraphBuilder } from './graph.js';
import { NoteBuilder } from './note.js';
import * as constants from './constants.js';
import { execSync } from 'child_process';
import pdfmerge from 'pdf-merge';
var PDFMerge = { pdfmerge: pdfmerge };
import * as fs from 'fs';
import * as gexf from 'graphology-gexf';
import { exec } from 'child_process';
//const graph: Graph = GraphBuilder.loadGraph();
var graphs = GraphBuilder.loadGraphs();
// server setup
var port = 8080;
var ports = {};
Object.keys(graphs).forEach(function (graph_name) {
    ports[port] = graph_name;
    port += 1;
});
Object.values(ports).forEach(function (path) {
    console.log("autosaving ".concat(path, " with automated git commit.."));
    execSync("cd ".concat(path, " && git add *"));
    try {
        execSync("cd ".concat(path, " && git commit -m \"automated commit\""));
        console.log("autosaving ".concat(path, ": SUCCESS"));
    }
    catch (err) {
        console.log(new Buffer(err.stdout).toString('ascii'));
        console.log("autosaving ".concat(path, ": FAILED"));
    }
});
console.log("serving following graphs:");
console.log(ports);
function getGraphFromRequest(req) {
    var port = req.socket.localPort;
    var graph_name = ports[port];
    console.log("getGraphFromRequest", port, graph_name);
    return graphs[graph_name];
}
import express from "express";
import cors from "cors";
var app = express();
app.use(cors());
/**
* @api {get} / Graph Debug
* @apiName GraphDebug
* @apiGroup Graph
*
* @apiSuccess {String} order of the graph
*/
app.get("/", function (req, res) {
    var graph = getGraphFromRequest(req);
    res.send("graph order is ".concat(graph.order));
});
/**
* @api {get} /script/ Execute Script
* @apiName Script
* @apiGroup Graph
* @apiParam {String} UUID of note containing typescript script, you will have `graph` in your local context
*
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*/
app.get("/script", function (req, res) {
    var graph = getGraphFromRequest(req);
    var file = graph.getNodeAttribute(req.query.scriptUUID, 'fullpath');
    eval(fs.readFileSync(file, { encoding: 'utf8', flag: 'r' }));
    res.sendStatus(200);
});
/**
* @api {get} /load-graph/ Load Graph
* @apiName LoadGraph
* @apiGroup Graph
*
* @apiDescription load graph string from browser for GraphBuilder.loadGraph or gexf.parse
* @apiSuccess {JSON} {graph: graph string in gexf format}
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "graph": "{"graph":"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<gexf version=\"1.2\" xmlns=\"http://www.gexf.net/1.2draft\" xmlns:viz=\"http:///www.gexf.net/1.1draft/viz\">\n  <meta/>\n  <graph defaultedgetype=\"directed\">\n    <attributes class=\"node\">\n      <attribute id=\"mdfile\" title=\"mdfile\" type=\"string\"/>\n      <attribute id=\"title\" title=\"title\" type=\"string\"/>\n      <attribute id=\"fullpath\" title=\"fullpath\" type=\"string\"/>\n     ...}"
*     }
*/
app.get(constants.ENDPOINTS.LOAD_GRAPH, function (req, res) {
    graphs = GraphBuilder.loadGraphs();
    var graph = getGraphFromRequest(req);
    console.log(constants.ENDPOINTS.LOAD_GRAPH, req.query);
    res.send({ graph: gexf.write(graph) });
});
/**
* @api {get} /create-uncurated-note/ Create Uncurated Note
* @apiName CreateUncuratedNote
* @apiGroup Note
*
* @apiSuccess {String} url of uncurated note
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     "./data/public/testgraph/markdown/e86860c0-f7a2-11ec-834a-930074e48e7c.md"
*/
app.get(constants.ENDPOINTS.CREATE_UNCURATED_NOTE, function (req, res) {
    var graph = getGraphFromRequest(req);
    console.log(constants.ENDPOINTS.CREATE_UNCURATED_NOTE, req.query);
    var note = NoteBuilder.createUncuratedNote(graph);
    console.log("200 OK", note);
    res.send(note);
});
/**
* @api {get} /update-node-attributes/ Update Node Attributes
* @apiName UpdateNodeAttributes
* @apiGroup Graph
* @apiParam {String} node this is node key (a uuid)
* @apiParam {String} x
* @apiParam {String} y
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*/
app.get(constants.ENDPOINTS.UPDATE_NODE_ATTRIBUTE, function (req, res) {
    var graph = getGraphFromRequest(req);
    console.log(constants.ENDPOINTS.UPDATE_NODE_ATTRIBUTE, req.query);
    graph.setNodeAttribute(req.query.node, 'x', req.query.x);
    graph.setNodeAttribute(req.query.node, 'y', req.query.y);
    var nodeAttributes = graph.getNodeAttributes(req.query.node);
    console.log("NODE INFO: ", nodeAttributes);
    exec("sh ./bin/log.sh ".concat(nodeAttributes.mdfile, " ").concat(nodeAttributes.title, " ").concat(constants.ENDPOINTS.UPDATE_NODE_ATTRIBUTE));
    GraphBuilder.save(graph);
    res.sendStatus(200);
});
/**
* @api {get} /create-curated-note/ Create Curated Note
* @apiName CreateCuratedNote
* @apiGroup Note
* @apiParam {String} title name of the new note
* @apiParam {String} parent uuid of the parent note
*
* @apiSuccess {String} url of curated note
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     "./data/public/testgraph/markdown/e86860c0-f7a2-11ec-834a-930074e48e7c.md"
*/
app.get(constants.ENDPOINTS.CREATE_CURATED_NOTE, function (req, res) {
    var graph = getGraphFromRequest(req);
    console.log(constants.ENDPOINTS.CREATE_CURATED_NOTE, req.query);
    var note = NoteBuilder.createCuratedNote(graph, req.query.title, req.query.parent);
    console.log("200 OK", note);
    res.send(note);
});
/**
* @api {get} /create-person/ Create Person
* @apiName CreatePerson
* @apiGroup Person
* @apiParam {String} personName name of the person
*
* @apiSuccess {String} url of person note
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     "./data/public/testgraph/markdown/e86860c0-f7a2-11ec-834a-930074e48e7c.md"
*/
app.get(constants.ENDPOINTS.CREATE_PERSON, function (req, res) {
    var graph = getGraphFromRequest(req);
    console.log(constants.ENDPOINTS.CREATE_PERSON, req.query);
    var note = NoteBuilder.createPerson(graph, req.query.personName);
    console.log("200 OK", note);
    res.send(note);
});
/**
* @api {get} /create-file/ Create File
* @apiName Createfile
* @apiGroup File
* @apiParam {String} title
* @apiParam {String} filePath, usually .pdf
* @apiParam {String} parentUUID
*
* @apiSuccess {String} url of file
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*     "./data/public/testgraph/pdf/test.pdf"
*/
app.get(constants.ENDPOINTS.CREATE_FILE, function (req, res) {
    var graph = getGraphFromRequest(req);
    console.log(constants.ENDPOINTS.CREATE_FILE, req.query);
    var note = NoteBuilder.createFile(graph, req.query.title, req.query.filePath, req.query.parentUUID);
    console.log("200 OK", note);
    res.send(note);
});
/**
* @api {get} /reference-note/ Reference Note
* @apiName ReferenceNote
* @apiGroup Note
* @apiParam {String} childrenNote
* @apiParam {String} parentNote
* @apiDescription add an edge between two notes
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*/
app.get(constants.ENDPOINTS.REFERENCE_CURATED_NOTE, function (req, res) {
    var graph = getGraphFromRequest(req);
    console.log(constants.ENDPOINTS.REFERENCE_CURATED_NOTE, req.query);
    NoteBuilder.referenceCuratedNote(graph, req.query.childrenNote, req.query.parentNote);
    console.log("200 OK");
    res.sendStatus(200);
});
/**
* @api {get} /edit-note/ Edit Note
* @apiName Edit Note
* @apiGroup Note
* @apiParam {String} noteUUID
* @apiDescription send a signal that the note is being edited mostly for time tracking
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
*/
app.get(constants.ENDPOINTS.EDIT_NOTE, function (req, res) {
    var graph = getGraphFromRequest(req);
    console.log(constants.ENDPOINTS.EDIT_NOTE, req.query);
    NoteBuilder.noteEvent(graph, req.query.noteUUID, constants.EVENT_TYPE.EDIT);
    console.log("200 OK");
    res.sendStatus(200);
});
Object.entries(ports).forEach(function (_a, _) {
    var port = _a[0], graph = _a[1];
    return app.listen(port, function () { console.log("server started at http://localhost:".concat(port)); });
});
