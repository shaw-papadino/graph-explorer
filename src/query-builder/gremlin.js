import QueryManagerBase from "./base";


export default class GremlinQueryManager extends QueryManagerBase {

    initQuery() {
        return "g.V().limit(10).toList()";
    }

    getOutEdgeVertices(vertexId) {
        // #TODO - improve query performance ?
        console.log("===vertexId", vertexId);
        return "node=g.V(" + vertexId + ").toList(); " +
            "edges = g.V(" + vertexId + ").inE().dedup().toList(); " +
            "other_nodes = g.V(" + vertexId + ").inE().otherV().dedup().toList();" +
            "[other_nodes,edges,node]";
    }

    getInEdgeVertices(vertexId) {
        // #TODO - improve query performance ?

        console.log("===vertexId", vertexId);
        return "node=g.V(" + vertexId + ").toList(); " +
            "edges = g.V(" + vertexId + ").outE().dedup().toList(); " +
            "other_nodes = g.V(" + vertexId + ").outE().otherV().dedup().toList();" +
            "[other_nodes,edges,node]";
    }

}

