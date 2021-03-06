import * as PIXI from 'pixi.js-legacy'
// import * as PIXI from 'pixi.js';
import {Viewport} from 'pixi-viewport'
// import {colorToNumber} from "../canvas-utils";
// import FontFaceObserver from "fontfaceobserver";
import EventStore from "./events";
import GraphicsStore from "../../core/graphics-store";
import {colorToNumber} from "../canvas-utils";
import {LightenDarkenColor} from "../../core/utils";

export default class GraphicsEngine {


    /*



    let graphicsEngine = new GraphicsEngine(settings, dataStore, onElementSelected);




     */

    renderRequestId = undefined;
    // clickedNodeData = undefined;
    isRendering = undefined;
    nodeMenuEl = undefined;
    isFirstLoaded = true

    //
    // loadFont(fontFamily) {
    //     // new FontFaceObserver(fontFamily).load();
    // }

    constructor(canvasElem, nodeMenuEl, settings, dataStore, onElementSelected) {
        // let _this = this;
        this.settings = settings;
        this.dataStore = dataStore;
        this.graphicsStore = new GraphicsStore(this.dataStore, this);

        this.nodeMenuEl = nodeMenuEl;
        this.eventStore = new EventStore(nodeMenuEl);
        this.onElementSelected = onElementSelected; // used to send back any message to react component.


        this.nodeLabels = Object.assign({}, JSON.parse(localStorage.getItem('nodeLabels')));
        this.linkLabels = Object.assign({}, JSON.parse(localStorage.getItem('linkLabels')));
        // this.loadFont(this.settings.ICON_FONT_FAMILY);
        //
        // new FontFaceObserver(this.settings.ICON_FONT_FAMILY).load();

        // create PIXI application
        this.pixiApp = new PIXI.Application({
            width: this.settings.SCREEN_WIDTH,
            height: this.settings.SCREEN_HEIGHT,
            resolution: this.settings.RESOLUTION,
            transparent: true,
            // backgroundColor: 0xFFFFFF,
            antialias: true,
            autoStart: false, // disable automatic rendering by ticker, render manually instead, only when needed
            forceCanvas: true,
            autoDensity: true
        });
        this.pixiApp.view.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        canvasElem.appendChild(this.pixiApp.view);

        this.viewport = new Viewport({
            screenWidth: this.settings.SCREEN_WIDTH,
            screenHeight: this.settings.SCREEN_HEIGHT,
            worldWidth: this.settings.WORLD_WIDTH,
            worldHeight: this.settings.WORLD_HEIGHT,
            interaction: this.pixiApp.renderer.plugins.interaction
        });
        this.viewport.clampZoom({
            minScale: this.settings.ZOOM_CLAMP_MIN_SCALE,
            maxScale: this.settings.ZOOM_CLAMP_MAX_SCALE
        })

        this.viewport.on('frame-end', () => {
            if (this.viewport.dirty) {
                this.requestRender();
                this.viewport.dirty = false;
            }
        });

        this.viewport.on('rightdown', (e) => {
            // alert("right down",);
                    this.eventStore.hideMenu();

            // let pos = this.viewport.toWorld(e.data.global);
            // this.clientEngine.sendInput('mousePos', { x: pos.x, y: this.gameEngine.worldHeight - pos.y });
        })
        // this.viewport.on('drag-start', (e) => {
        //     console.log("viewport drag-start", e);
        // });

        //
        // this.viewport.on('moved', (e) => {
        //     console.log("viewport moved", e);
        //
        //
        //     if (e.viewport.lastViewport) {
        //         // _this.dataStore.selectedElementData
        //         const selectedNodeData = this.eventStore.lastSelectedNodeData;
        //         if (selectedNodeData) {
        //             const nodeGfx = _this.graphicsStore.nodeDataToNodeGfx.get(selectedNodeData.id);
        //             console.log("======nodeGfx", nodeGfx.x, nodeGfx.y, nodeGfx);
        //             if (nodeGfx) {
        //                 _this.moveNodeMenuToPoint(nodeGfx.x, nodeGfx.y);
        //             }
        //
        //         }
        //
        //     }
        //
        //     // // get the position of the node that is selected.
        //
        // });


        this.setupCanvas();
        this.preventWheelScrolling();
        this.requestRender();

    }

    setNodeElem(nodeMenuEl) {
        this.nodeMenuEl = nodeMenuEl;
    }

    // moveNodeMenuToPoint(x, y) {
    //     console.log("moveNodeMenuToPoint", x, y);
    //     this.nodeMenuEl.style.left = x + "px";
    //     this.nodeMenuEl.style.top = y + "px";
    //
    // }

    setupCanvas() {
        // create PIXI viewport

        this.pixiApp.stage.addChild(this.viewport);
        this.viewport
            .drag()
            .pinch()
            .wheel()
            .decelerate();


        // adding layers for nodes and links
        this.nodeMenuLayer = new PIXI.Container();
        this.viewport.addChild(this.nodeMenuLayer);

        this.linksLayer = new PIXI.Container();
        this.viewport.addChild(this.linksLayer);

        this.linksLabelsLayer = new PIXI.Container();
        this.viewport.addChild(this.linksLabelsLayer);

        this.nodesLayer = new PIXI.Container();
        this.viewport.addChild(this.nodesLayer);

        this.nodeLabelsLayer = new PIXI.Container();
        this.viewport.addChild(this.nodeLabelsLayer);

        this.frontLayer = new PIXI.Container();
        this.viewport.addChild(this.frontLayer);

    }

    requestRender = () => {
        let _this = this;
        if (this.renderRequestId) {
            return;
        }
        this.renderRequestId = window.requestAnimationFrame(() => {
            _this.pixiApp.render();
            _this.renderRequestId = undefined;
        });
    }

    zoom2Point(x, y) {
        this.viewport.center = new PIXI.Point(x, y);
        this.viewport.fit(true, this.settings.WORLD_WIDTH / 4, this.settings.WORLD_HEIGHT / 4)
        this.viewport.setZoom(1, true);
        this.eventStore.hideMenu();
    }

    zoom2Node(nodeId) {
        const nodeContainer = this.graphicsStore.nodeDataToNodeGfx.get(nodeId);
        this.zoom2Point(nodeContainer.x, nodeContainer.y)
    }


    getNodeBorderGfx(nodeContainer) {
        return nodeContainer.children[0];
    }

    highlightNodeById(nodeId) {
        const nodeContainer = this.graphicsStore.nodeDataToNodeGfx.get(nodeId);
        this.getNodeBorderGfx(nodeContainer).alpha = this.settings.NODE_BORDER_HIGHLIGHT_ALPHA;
    }

    unHighlightNodeById(nodeId) {
        const nodeContainer = this.graphicsStore.nodeDataToNodeGfx.get(nodeId);
        this.getNodeBorderGfx(nodeContainer).alpha = this.settings.NODE_BORDER_UN_HIGHLIGHT_ALPHA;
    }

    resetViewport() {
        this.zoom2Point(this.settings.WORLD_WIDTH / 4, this.settings.WORLD_HEIGHT / 4)
        this.viewport.setZoom(0.5, true);
        // this.viewport.center = new PIXI.Point(this.settings.WORLD_WIDTH / 4, this.settings.WORLD_HEIGHT / 4);
        // this.viewport.fit(true, this.settings.WORLD_WIDTH / 4, this.settings.WORLD_HEIGHT / 4)
        // this.viewport.setZoom(0.5, true);
        // this.nodeMenuEl.style.display = "none";

    }

    // getNodeLabel(nodeData) {
    //     console.log("&&&&", nodeData);
    //     console.log("&&&&", nodeData.meta.shapeOptions);
    //     let labelString = null;
    //     if (nodeData.meta.shapeOptions.labelPropertyKey === "id") {
    //         labelString = nodeData.id;
    //     } else {
    //         labelString = nodeData.properties[nodeData.meta.shapeOptions.labelPropertyKey];
    //     }
    //     if (!labelString) {
    //         labelString = nodeData.id;
    //     }
    //     return labelString;
    // }


    // getLinkLabel(linkData) {
    //     return linkData.source.id + "-" + linkData.target.id;
    // }

//
//     background(bgSize, inputSprite, type, forceSize) {
//         /*
//         https://gist.github.com/ClickSimply/581823db9cdc8d94ed3f78c1a548f50d
// *  PixiJS Background Cover/Contain Script
// *   Returns object
// * . {
// *       container: PixiJS Container
// * .     doResize: Resize callback
// *   }
// *   ARGS:
// *   bgSize: Object with x and y representing the width and height of background. Example: {x:1280,y:720}
// *   inputSprite: Pixi Sprite containing a loaded image or other asset.  Make sure you preload assets into this sprite.
// *   type: String, either "cover" or "contain".
// *   forceSize: Optional object containing the width and height of the source sprite, example:  {x:1280,y:720}
// */
//         var sprite = inputSprite;
//         var bgContainer = new PIXI.Container();
//         var mask = new PIXI.Graphics().beginFill(0x8bc5ff).drawRect(0, 0, bgSize.x, bgSize.y).endFill();
//         bgContainer.mask = mask;
//         bgContainer.addChild(mask);
//         bgContainer.addChild(sprite);
//
//         function resize() {
//             var sp = {x: sprite.width, y: sprite.height};
//             if (forceSize) sp = forceSize;
//             var winratio = bgSize.x / bgSize.y;
//             var spratio = sp.x / sp.y;
//             var scale = 1;
//             var pos = new PIXI.Point(0, 0);
//             if (type === 'cover' ? (winratio > spratio) : (winratio < spratio)) {
//                 //photo is wider than background
//                 scale = bgSize.x / sp.x;
//                 pos.y = -((sp.y * scale) - bgSize.y) / 2
//             } else {
//                 //photo is taller than background
//                 scale = bgSize.y / sp.y;
//                 pos.x = -((sp.x * scale) - bgSize.x) / 2
//             }
//
//             sprite.scale = new PIXI.Point(scale, scale);
//             sprite.position = pos;
//         }
//
//         resize();
//
//         return {
//             container: bgContainer,
//             doResize: resize
//         }
//     }

    createNode(nodeData) {
        const _this = this;
        const {
            NODE_HIT_RADIUS,
            // NODE_RADIUS,
            LABEL_FONT_FAMILY, LABEL_FONT_SIZE,
            LABEL_X_PADDING,
            LABEL_Y_PADDING,
            NODE_SELECTED_STROKE_WIDTH,
            NODE_FOCUSED_NODE_BORDER_COLOR
            // ICON_TEXT,
            // ICON_FONT_FAMILY,
            // ICON_FONT_SIZE
        } = this.settings;


        /*

        meta:
bgImagePropertyKey: undefined
bgImageUrl: undefined
labelOptions:
labelColor: "#dddddd"
labelText: "Hilda"
showLabel: false
__proto__: Object
nodeShape: "circle"
shapeOptions:
fillColor: "#406fbf"
inShapeHTML: "Hilda"
radius: 24
strokeColor: "#efefef"
strokeWidth: 3
labelColor: "#dddddd"
         */


        // console.log("====nodeData>>>", nodeData)
        const nodeContainer = new PIXI.Container();
        nodeContainer.x = nodeData.x;
        nodeContainer.y = nodeData.y;
        nodeContainer.interactive = true;
        nodeContainer.buttonMode = true;
        nodeContainer.hitArea = new PIXI.Circle(0, 0, nodeData.meta.shapeOptions.radius);

        // console.log("event.currentTarget", )
        nodeContainer.on('rightdown', (event) => _this.eventStore.onNodeRightClicked(_this, this.dataStore.getVertex(_this.graphicsStore.nodeGfxToNodeData.get(event.currentTarget)), nodeContainer, event));
        nodeContainer.on('mousedown', (event) => _this.eventStore.onNodeClicked(_this, this.dataStore.getVertex(_this.graphicsStore.nodeGfxToNodeData.get(event.currentTarget)), nodeContainer, event));
        nodeContainer.on('mouseover', (event) => _this.eventStore.onNodeMouseOver(_this, this.dataStore.getVertex(_this.graphicsStore.nodeGfxToNodeData.get(event.currentTarget)), nodeContainer, event));
        nodeContainer.on('mouseout', (event) => _this.eventStore.onNodeMouseOut(_this, this.dataStore.getVertex(_this.graphicsStore.nodeGfxToNodeData.get(event.currentTarget)), nodeContainer, event));
        nodeContainer.on('mouseup', (event) => this.eventStore.onNodeUnClicked(_this, this.dataStore.getVertex(_this.graphicsStore.nodeGfxToNodeData.get(event.currentTarget)), nodeContainer));
        nodeContainer.on('mouseupoutside', (event) => this.eventStore.onNodeUnClicked(_this, this.dataStore.getVertex(_this.graphicsStore.nodeGfxToNodeData.get(event.currentTarget)), nodeContainer));


        // console.log("nodeData======", nodeData.label, nodeData.meta.labelOptions.labelText, nodeData)


        const circleSelectedBorder = new PIXI.Graphics();
        circleSelectedBorder.x = 0;
        circleSelectedBorder.y = 0;
        circleSelectedBorder.lineStyle(NODE_SELECTED_STROKE_WIDTH, NODE_FOCUSED_NODE_BORDER_COLOR);
        circleSelectedBorder.drawCircle(0, 0, nodeData.meta.shapeOptions.radius);
        circleSelectedBorder.alpha = 0;
        nodeContainer.addChild(circleSelectedBorder);

        const circle = new PIXI.Graphics();
        circle.x = 0;
        circle.y = 0;
        circle.beginFill(nodeData.meta.shapeOptions.fillColor);
        circle.drawCircle(0, 0, nodeData.meta.shapeOptions.radius);
        nodeContainer.addChild(circle);

        const circleBorder = new PIXI.Graphics();
        circleBorder.x = 0;
        circleBorder.y = 0;
        circleBorder.lineStyle(nodeData.meta.shapeOptions.strokeWidth, nodeData.meta.shapeOptions.strokeColor);
        circleBorder.drawCircle(0, 0, nodeData.meta.shapeOptions.radius);
        nodeContainer.addChild(circleBorder);

        // const icon = new PIXI.Text(ICON_TEXT, {
        //     fontFamily: ICON_FONT_FAMILY,
        //     fontSize: ICON_FONT_SIZE,
        //     fill: colorToNumber(nodeData.meta.shapeOptions.labelColor)
        // });
        // icon.x = 0;
        // icon.y = 0;
        // icon.anchor.set(0.5);
        // nodeContainer.addChild(icon);

        const nodeLabelContainer = new PIXI.Container();
        nodeLabelContainer.x = nodeData.x;
        nodeLabelContainer.y = nodeData.y;
        nodeLabelContainer.interactive = true;
        nodeLabelContainer.buttonMode = true;

        const nodeLabelText = new PIXI.Text(nodeData.meta.labelOptions.labelText, {
            fontFamily: LABEL_FONT_FAMILY,
            fontSize: LABEL_FONT_SIZE,
            fill: nodeData.meta.labelOptions.labelColor
        });
        nodeLabelText.resolution = this.settings.LABEL_RESOLUTION;

        nodeLabelText.x = LABEL_X_PADDING;
        nodeLabelText.y = NODE_HIT_RADIUS + LABEL_Y_PADDING;
        nodeLabelText.anchor.set(0.5, 0);

        nodeLabelContainer.addChild(nodeLabelText);
        // nodeLabelContainer.alpha = 0.5;
        return {nodeContainer, nodeLabelContainer}
    }


    createNodes(nodes) {
        // create node graphics
        let _this = this;
        let newNodes = [];
        nodes.forEach(nodeData => {
            const nodeGfx = _this.graphicsStore.nodeDataToNodeGfx.get(nodeData.id);
            if (!nodeGfx) {
                newNodes.push(nodeData);
            }
        })
        return newNodes.map((nodeData) => {

            const nodeGfx = _this.graphicsStore.nodeDataToNodeGfx.get(nodeData.id);
            if (!nodeGfx) {
                // create node if doesn't exist
                const {nodeContainer, nodeLabelContainer} = this.createNode(nodeData);
                this.nodesLayer.addChild(nodeContainer);
                this.nodeLabelsLayer.addChild(nodeLabelContainer);
                return [nodeData, nodeContainer, nodeLabelContainer];
            }

        });

    }


    clearCanvas() {

        this.clearNodeCanvas();
        this.clearLinkCanvas();
        while (this.frontLayer.firstChild) {
            this.frontLayer.removeChild(this.frontLayer.firstChild);
        }
    }

    clearNodeCanvas() {

        while (this.nodesLayer.firstChild) {
            console.log("===removing NodeCanvas");
            this.nodesLayer.removeChild(this.nodesLayer.firstChild);
        }
        while (this.nodeLabelsLayer.firstChild) {
            this.nodeLabelsLayer.removeChild(this.nodeLabelsLayer.firstChild);
        }


    }

    clearLinkCanvas() {
        // console.log("this.dataStore.linkGraphicsArray.", this.dataStore.linkGraphicsArray.length)
        while (this.dataStore.linkGraphicsArray.length > 0) {
            let linkGraphics = this.dataStore.linkGraphicsArray.pop();
            try {
                linkGraphics.clear();
                this.linksLayer.removeChild(linkGraphics);
                linkGraphics.destroy();
            } catch (e) {
                console.log("Failed to clear link graphics with error", e);
            }
        }
        while (this.dataStore.linkLabelGraphicsArray.length > 0) {
            let linkLabelGraphics = this.dataStore.linkLabelGraphicsArray.pop();
            try {
                linkLabelGraphics.clear();
                this.linksLabelsLayer.removeChild(linkLabelGraphics);
                linkLabelGraphics.destroy();
            } catch (e) {
                console.log("Failed to clear link graphics with error", e);
            }
        }
    }


    linearDistanceBetweenTwoPoints(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    }

    getPointForArrowAtPointWithPadding(x1, y1, x2, y2, padding) {

        const d = this.linearDistanceBetweenTwoPoints(x1, y1, x2, y2)
        const dt = d - padding;
        //ratio of distances
        let t = dt / d;
        const x = (1 - t) * x1 + t * x2;
        const y = (1 - t) * y1 + t * y2;
        return {x, y};

    }

    // getTrianglePointsTan


    getNormalAndTangentForTwoPoints(x1, y1, x2, y2, sameIndex) {
        // x1, y1 is the first point and x2, y2 is the second point.

        console.log("I might use sameIndex someday", sameIndex)

        let normal = [
            -(y2 - this.settings.NODE_RADIUS),
            x2 - this.settings.NODE_RADIUS,
        ]


        const l = Math.sqrt(normal[0] ** 2 + normal[1] ** 2);
        normal[0] /= l;
        normal[1] /= l;

        const tangent = [
            -normal[1] * 45,
            normal[0] * 45
        ]

        normal[0] *= 30;
        normal[1] *= 30;
        return {normal, tangent,}
    }


    createTriangle(linkData, arrowColor) {
        // 4d. Create a triangle https://stackoverflow.com/a/58573859/3448851
        let triangle = new PIXI.Graphics();
        triangle.lineStyle(1, arrowColor, 1);
        triangle.beginFill(arrowColor, 1)
        // first, let's compute normalized vector for our link:
        let dx = linkData.target.x - linkData.source.x;
        let dy = linkData.target.y - linkData.source.y;
        let l = Math.sqrt(dx * dx + dy * dy);

        if (l === 0) return; // if length is 0 - can't render arrows

        // This is our normal vector. It describes direction of the graph
        // link, and has length == 1:
        let nx = dx / l;
        let ny = dy / l;

        // Now let's draw the arrow:
        let arrowLength = 3 * 2;       // Length of the arrow
        let arrowWingsLength = 2.5 * 2;  // How far arrow wings are from the link?

        // This is where arrow should end. We do `(l - NODE_WIDTH)` to
        // make sure it ends before the node UI element.
        let ex = linkData.source.x + nx * (l - linkData.target.meta.shapeOptions.radiusBuffered);
        let ey = linkData.source.y + ny * (l - linkData.target.meta.shapeOptions.radiusBuffered);

        // Offset on the graph link, where arrow wings should be
        let sx = linkData.source.x + nx * (l - linkData.target.meta.shapeOptions.radiusBuffered - arrowLength);
        let sy = linkData.source.y + ny * (l - linkData.target.meta.shapeOptions.radiusBuffered - arrowLength);

        // orthogonal vector to the link vector is easy to compute:
        let topX = -ny;
        let topY = nx;

        // Let's draw the arrow:
        triangle.moveTo(ex, ey);
        triangle.lineTo(sx + topX * arrowWingsLength, sy + topY * arrowWingsLength);
        // triangle.moveTo(ex, ey);
        triangle.lineTo(sx - topX * arrowWingsLength, sy - topY * arrowWingsLength);
        triangle.lineTo(ex, ey);
        triangle.endFill();
        return triangle;
    }


    createLink(linkData) {

        /*

        refer for curved lines with arrows
        https://stackoverflow.com/questions/11808860/how-to-place-arrow-head-triangles-on-svg-lines
         */
        // console.log("=======linkData", linkData.meta.shapeOptions.strokeColor, linkData);


        const linkColor = linkData.meta.shapeOptions.strokeColor;
        const {LINK_DEFAULT_LABEL_FONT_SIZE, LABEL_FONT_FAMILY, LINK_DEFAULT_WIDTH} = this.settings;
        let _this = this;
        let linkGfx = new PIXI.Graphics();
        let linkGfxLabel = new PIXI.Graphics();
        linkGfx.lineStyle(Math.sqrt(LINK_DEFAULT_WIDTH), linkColor);

        // draw straight line with arrow and label if avaiable!
        linkGfx.moveTo(linkData.source.x, linkData.source.y);
        linkGfx.lineTo(linkData.target.x, linkData.target.y);

        const strokeColor = linkData.meta.shapeOptions.strokeColorHex;
        const arrowColor = colorToNumber(LightenDarkenColor(strokeColor, -30));

        const triangle = this.createTriangle(linkData, arrowColor);
        linkGfx.addChild(triangle);

        if (linkData.meta.labelOptions.labelText) {
            const linkLabelText = new PIXI.Text(linkData.meta.labelOptions.labelText, {
                fontFamily: LABEL_FONT_FAMILY,
                fontSize: LINK_DEFAULT_LABEL_FONT_SIZE,
                fill: _this.settings.LINK_DEFAULT_LABEL_COLOR
            });
            linkLabelText.resolution = this.settings.LABEL_RESOLUTION;
            // set label in the middle
            linkLabelText.x = (linkData.source.x + linkData.target.x) / 2 - 10;
            linkLabelText.y = (linkData.source.y + linkData.target.y) / 2 - 10;
            // const sameIndex = 1;
            linkLabelText.anchor.set(0.5, 0);
            linkGfxLabel.addChild(linkLabelText)
        }


        /*
        multiple links issue can be fixed here

         */

        /*
        if (sameIndex === 1) {
            linkGfx.moveTo(linkData.source.x, linkData.source.y);

            linkGfx.lineTo(linkData.target.x, linkData.target.y);
            linkGfx.beginFill(linkColor, 1);


            // triangle for the arrow
            //  The distance between Start and End point is given by
            // xt, yt are the coordinates at a distance dt from source.
            const t2 = this.getPointForArrowAtPointWithPadding(linkData.source.x, linkData.source.y,
                linkData.target.x, linkData.target.y, this.settings.NODE_RADIUS + 1)
            // const d = Math.sqrt((linkData.target.x - linkData.source.x) ** 2 + (linkData.target.y - linkData.source.y) ** 2)

            // points for triangle with points t1, t2(point touching to circle), t3
            const t1 = this.getPointForArrowAtPointWithPadding(
                linkData.target.x + normal[0] + tangent[0],
                linkData.target.y + normal[1] + tangent[1],
                t2.x, t2.y, 6
            )
            const t3 = this.getPointForArrowAtPointWithPadding(
                linkData.target.x - normal[0] + tangent[0],
                linkData.target.y - normal[1] + tangent[1],
                t2.x, t2.y
                , 6
            )

            linkGfx.lineStyle(1, linkColor, 1, .5)
                .moveTo(t1.x, t1.y)
            linkGfx.lineTo(t2.x, t2.y)
                .lineTo(t3.x, t3.y)
                .lineTo(t1.x, t1.y)
                .closePath()


        }
        */

        /*
                else {
                    linkGfx.moveTo(linkData.source.x, linkData.source.y);

                    console.log("linkData=====", linkData, nextPoint.x, nextPoint.y)



                    linkGfx
                        .bezierCurveTo(linkData.source.x, linkData.source.y,
                            nextPoint.x + 50, nextPoint.y + 50,
                            linkData.target.x, linkData.target.y)

                    // let linkCurveGfx = new PIXI.Graphics()
                    // linkCurveGfx.lineStyle(10, 0xff0000, 1)
                    //
                    // linkCurveGfx.moveTo(linkData.source.x, linkData.source.y);
                    //
                    // linkCurveGfx.beginFill(this.settings.LINK_DEFAULT_COLOR, 1);
                    // linkCurveGfx.arcTo(
                    //     linkData.source.x, linkData.source.y, linkData.target.x, linkData.target.y, linkData.sameIndex * 600
                    // )
                    console.log("+++", linkData.source.x, linkData.source.y, linkData.target.x, linkData.target.y, linkData.sameIndex * 60)
                    // linkCurveGfx.lineStyle(10,0xff0000, 0.5)
                    // linkCurveGfx.lineTo(200,200)

                    //             let linkCurveGfx = new PIXI.Graphics()
                    // linkCurveGfx.lineStyle(10,0x000000)
                    //
                    // linkCurveGfx.moveTo(0,0)
                    // linkCurveGfx.arcTo(0,100,200,200, 600)
                    // linkCurveGfx.lineStyle(10,0xff0000, 0.5)a
                    // linkCurveGfx.lineTo(200,200)

                    // linkGfx.addChild(linkCurveGfx)


                    //
                    // linkGfx.beginFill(this.settings.LINK_DEFAULT_COLOR, 1);
                    // // triangle for the arrow
                    // linkGfx.lineStyle(1, this.settings.LINK_DEFAULT_COLOR, 1, .5)
                    //     .moveTo(t1.x, t1.y)
                    // linkGfx.lineTo(t2.x, t2.y)
                    //     .lineTo(t3.x, t3.y)
                    //     .lineTo(t1.x, t1.y)

                    // set label at the next point
                    linkLabelText.x = (linkData.source.x + linkData.target.x) / 2 - 10 * sameIndex;
                    linkLabelText.y = (linkData.source.y + linkData.target.y) / 2 - 10 * sameIndex;
                    // linkLabelText.x = nextPoint.x;
                    // linkLabelText.y = nextPoint.y;


                }
        */

        // )
        // linkGfx.buttonMode = true;
        linkGfx.endFill();


        let interval = setInterval(() => {
            if (linkGfx.geometry && linkGfx.geometry.graphicsData.length > 0) {
                let points = linkGfx.geometry.graphicsData[0].shape.points;
                // console.log("points interval", points.length, points);
                if (points.length > 0) {
                    linkGfx.interactive = true;
                    linkGfx.buttonMode = true;

                    if (points.length === 4) {
                        // this is straight line; so making 2 point into 4 points to create a rectangle
                        // structure to create hitArea around the link connecting the nodes in straight line.
                        // const x1, y1, x2, y2 = points[0], points[1], points[2], points[3];
                        const x1 = points[0];
                        const y1 = points[1];
                        const x2 = points[2];
                        const y2 = points[3];
                        // console.log("x1-y1", x1, y1)
                        points = [x1 + 3, y1 + 3, x2 + 3, y2 + 3, x2 - 3, y2 - 3, x1 - 3, y1 - 3]
                    }

                    linkGfx.hitArea = new PIXI.Polygon(points);
                    // linkGfx.drawPolygon(points);
                    linkGfx.endFill();
                    linkGfxLabel.endFill();

                    // linkGfx.click = mouseover;
                    linkGfx.on("mouseover", (mouseData) => _this.eventStore.onLinkMouseOver(_this, linkData, linkGfx, mouseData));
                    linkGfx.on("mouseout", (mouseData) => _this.eventStore.onLinkMouseOut(_this, linkData, linkGfx, mouseData));
                    linkGfx.on('mousedown', event => _this.eventStore.onLinkClicked(_this, linkData, linkGfx, event));

                    clearInterval(interval);
                }
            }
        }, 50);

        linkGfx.alpha = this.settings.LINK_DEFAULT_ALPHA;
        linkGfxLabel.alpha = this.settings.LINK_DEFAULT_ALPHA;
        return {linkGfx, linkGfxLabel};

    }


    updatePositions = () => {
        console.log("updatePositions triggered",);
        this.clearLinkCanvas();
        this.updateNodePositions();
        this.updateLinkPositions();
        this.requestRender();
    };


    updateLinkPositions() {
        const links = this.dataStore.getAllRawEdgesList();
        const linkDataGfxPairs = [];
        for (let i = 0; i < links.length; i++) {
            let {linkGfx, linkGfxLabel} = this.createLink(links[i])
            this.dataStore.linkGraphicsArray.push(linkGfx);
            this.linksLayer.addChild(linkGfx);

            this.dataStore.linkLabelGraphicsArray.push(linkGfxLabel);
            this.linksLabelsLayer.addChild(linkGfxLabel);
            linkDataGfxPairs.push([links[i], linkGfx, linkGfxLabel])
        }
        this.graphicsStore.updateLinkPairs(linkDataGfxPairs);

    }


    updateNodePositions() {
        let _this = this;
        const nodes = this.dataStore.getAllRawVerticesList();
        for (const node of nodes) {
            if (_this.graphicsStore.nodeDataToNodeGfx.get(node.id)) {
                _this.graphicsStore.nodeDataToNodeGfx.get(node.id).position = new PIXI.Point(node.x, node.y)
            }
            if (_this.graphicsStore.nodeDataToLabelGfx.get(node.id)) {
                _this.graphicsStore.nodeDataToLabelGfx.get(node.id).position = new PIXI.Point(node.x, node.y)
            }
        }
    }


    renderGraphics() {


        // this.graphicsStore.clear();
        // this.
        this.isRendering = true
        const {verticesToRender, edgesToRender} = this.dataStore.getDataToRender();
        console.log("vertices2Render ======== ", verticesToRender.length);
        console.log("edges2Render ======== ", edgesToRender.length);

        // Create nodes
        const nodeDataGfxPairs = this.createNodes(verticesToRender);
        this.graphicsStore.updateNodePairs(nodeDataGfxPairs);

        // Create Links ?

        this.updatePositions();
        this.requestRender();


        // initial draw
        this.requestRender();

    }

    // addNewGraphics(newVertices, newEdges) {
    //     // const {nodes, links} = this.dataStore;
    //     console.log("======= total nodes and links after adding new data ", newVertices.length, newEdges.length);
    //
    //
    //     const nodeDataGfxPairs = this.createNodes(newVertices);
    //     this.graphicsStore.updateNodePairs(nodeDataGfxPairs);
    //
    //
    //     this.updatePositions(); // nodes will be created in this step anyways.
    // }


    preventWheelScrolling() {
        // prevent body scrolling
        this.pixiApp.view.addEventListener('wheel', event => {
            event.preventDefault();
        });
    }

}
