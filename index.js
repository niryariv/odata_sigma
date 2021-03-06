
function api_url(param) {
    return "https://www.odata.org.il/group/entities/api?name=" + param;
}

function redraw(){
    s.killForceAtlas2();
    s.startForceAtlas2({ 
        worker: true
    });
    setTimeout(() => { s.stopForceAtlas2() }, 400);
    s.refresh();
}

function highlight_path(src,dest){
    nodes = s.graph.astar(src, dest);
    if (typeof nodes == "undefined") return false;

    // first clear all highlit paths
    _.each(s.graph.edges(), function (e) { e.color = colors.edge });
    _.each(s.graph.nodes(), function (n) { n.color = n.has_groups ? colors.full_node : colors.hollow_node });

    for (var i = 0; i < nodes.length; i++) {
        var n = _.findIndex(s.graph.nodes(), {
            id: nodes[i].id,
        })
        s.graph.nodes()[n].color = colors.lit_node;

        
        if (i == nodes.length-1) continue;
        var e = _.findIndex(s.graph.edges(), {
            source: nodes[i].id,
            target: nodes[i + 1].id
        })
        s.graph.edges()[e].color = colors.lit_edge;
    }
    s.refresh();
    
}


function load_nodes_under(node_id) {
    $.getJSON(api_url(node_id), function (odata) {
        var main_node = odata.group;
        var nodes = odata.related_groups;


        if (typeof s.graph.nodes(main_node.name) == "undefined") {
            s.graph.addNode({
                id: main_node.name,
                label: main_node.display_name,
                x: 0, 
                y: 0, 
                type: 'circle',
                borderColor: colors.border,
                size: 2,
                color: main_node.name == src_node ? colors.lit_node : colors.full_node,
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
                    has_groups: n.num_new_related_groups > 0
                });
            }

            s.graph.addEdge({
                    id: main_node.name + '-' + n.name,
                    source: main_node.name,
                    target: n.name,
                    color: colors.edge
            })
        });

        redraw();
        highlight_path(src_node, main_node.name);
    });
}


var colors = {
    border: '#333',
    edge  : '#ccc',
    hollow_node : '#eee',
    full_node   : '#bbb',
    lit_node    : '#c54',
    lit_edge    : '#c54'
}

var s = new sigma({
    renderers: [
        {
            container: document.getElementById('container'),
            type: sigma.renderers.canvas,
        }
    ]
});
var cam = s.cameras[0];

s.settings('drawLabels', true);
s.settings('scalingMode', 'inside');
s.settings('sideMargin', 1);

// remove node labels border effect on hover
s.settings('labelHoverShadowColor', '#fff');
s.settings('labelHoverBGColor', '#c0c');


s.bind("clickNode", function (n) { 
    if (n.data.node.has_groups > 0 && full_screen)
        load_nodes_under(n.data.node.id) 
});

var listener = s.configNoverlap({
    nodes : s.graph.nodes()
});

var dragListener = new sigma.plugins.dragNodes(s, s.renderers[0]);

url_params = window.location.search.substring(1).split('&');


var src_node = url_params[0];
// for now, allow only full screen
var full_screen = true; //(url_params[1] == 'fullscreen') || false;

if (!full_screen){
    document.querySelector('#fullscreen').innerHTML = '<a href="?'+src_node+'&fullscreen" target="_blank">מסך מלא</a>';
}

load_nodes_under(src_node);