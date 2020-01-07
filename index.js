
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

var listener = s.configNoverlap({
    nodes : s.graph.nodes()
});

var dragListener = new sigma.plugins.dragNodes(s, s.renderers[0]);

var node_id = window.location.search.substring(1) || "mof";
load_nodes_under(node_id);