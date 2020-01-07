
// why isn't this part of remove_node? because we actually want to keep the original node. 
// remove_node is really just a helper
function __remove_children_nodes(node) {
    var children = nodes.filter(function (n) { return n.parent == node.id });
    return children.length == 0 ? false : children.forEach(function (n) { remove_children_nodes(n); remove_node(n) });
}

function __remove_node(node) {
    links = _.reject(links, function (l) { return (l.source == node || l.target == node) });
    nodes = _.reject(nodes, function (n) { return (n == node || n.parent == node) })
}

function __toggle_node(node) {
    children = _.where(nodes, { parent: node.id });
    return children.length > 0 ? remove_children_nodes(node) : load_nodes_under(node.id);
}

function __node_exists(node) {
    return (_.findWhere(nodes, { id: node.id }) || false);
}

function __add_node(new_node, parent = false) {
    exists = node_exists(new_node);
    if (exists) return exists;

    i = nodes.push(new_node);
    if (parent) links.push({ source: parent.id, target: new_node.id });

    return nodes[i - 1];
}

function __redraw() {
    nodes.forEach(function(n){
        s.graph.addNode({
            id: n.name,
            label: n.display_name,
            x: Math.random(),
            y: Math.random(),
            type: 'circle',
            borderColor: '#000',
            size: 2,
            color: '#f00'
        })
    })
}


function api_url(param) {
    return "https://www.odata.org.il/group/entities/api?name=" + param;
}

function center_on_node(node_id){
    var n = _.findWhere(s.graph.nodes(), { id: 'mof' });
    var cs = s.cameras[0].cameraPosition(n.x, n.y);

    s.cameras[0].goTo({x:cs.x, y:cs.y});
}


function load_nodes_under(node_id) {
    console.log("load_nodes_under:", node_id);
    $.getJSON(api_url(node_id), function (odata) {
        var main_node = odata.group;
        var nodes = odata.related_groups;

        if (typeof s.graph.nodes(main_node.name) == "undefined") {
            s.graph.addNode({
                id: main_node.name,
                label: main_node.display_name,
                x: Math.random(),
                y: Math.random(),
                type: 'circle',
                borderColor: colors.border,
                size: 2,
                color: colors.full_node,
                has_groups: main_node.num_new_related_groups
            })
        }
        

        nodes.forEach(function (n) {
            if (typeof s.graph.nodes(n.name) == "undefined") {
                s.graph.addNode({
                    id: n.name,
                    label: n.display_name,
                    x: Math.random(),
                    y: Math.random(),
                    type: 'circle',
                    borderColor: colors.border,
                    size: n.num_new_related_groups > 0 ? 2 : 1,
                    color: n.num_new_related_groups > 0 ? colors.full_node : colors.hollow_node,
                    has_groups: n.num_new_related_groups
                }).addEdge({
                    id: main_node.name + '-' + n.name,
                    source: main_node.name,
                    target: n.name,
                    color: colors.edge
                })
            }
        });

        s.killForceAtlas2();
        s.startForceAtlas2({ worker: true });
        setTimeout(() => { s.stopForceAtlas2() }, 400);
        s.refresh();

        center_on_node(main_node.name);
    });
}


var colors = {
    border: '#333',
    edge  : '#ccc',
    hollow_node: '#eee',
    full_node  : '#ccc',
}

var s = new sigma({
    renderers: [
        {
            container: document.getElementById('container'),
            type: sigma.renderers.canvas
        }
    ]
});

s.settings('drawLabels', true);
s.settings('scalingMode', 'outside');

s.bind("clickNode", function (n) { 
    console.log(n);
    if (n.data.node.has_groups > 0)
        load_nodes_under(n.data.node.id) 
});


// Configure the algorithm
var listener = s.configNoverlap({
    nodes : s.graph.nodes()
});

var dragListener = new sigma.plugins.dragNodes(s, s.renderers[0]);

node_id = window.location.search.substring(1) || "mof";
load_nodes_under(node_id);

