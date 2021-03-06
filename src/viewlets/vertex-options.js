import React from "react";
import RemoteGraphComponent from "../core/graph-component";
import {
    setElementColorOptionsToStorage,
} from "../core/utils";
import {
    managementVertexLabel
} from "../config";
import {getDefaultNodeOptions} from "../canvas/canvas-utils";


export default class VertexOptions extends RemoteGraphComponent {

    state = {
        ...this.state,
        nodeOptions: null
    }
    shallReload = true;

    // firstTime = false;
    //
    // componentWillUnmount() {
    //     this.setState({nodeOptions: null});
    //     // super.componentWillUnmount();
    //     // alert("vertex options unmounted")
    // }

    componentDidMount() {
        console.log("VO componentDidMount")

        // super.componentDidMount();
        console.log("======", this.props, this.requestBuilder);
        this.getSelectedLabelConfigData();
    }

    getSelectedLabelConfigData() {
        const queryPayload = this.connector.requestBuilder.getOrCreateVertices(
            managementVertexLabel, {name: this.props.selectedLabel}
        );
        this.makeQuery(queryPayload);
    }

    componentDidUpdate(prevProps) {
        console.log("VO componentDidUpdate")
        if (prevProps.selectedLabel !== this.props.selectedLabel) {
            // already data exist
            this.setState({nodeOptions: null});
            this.getSelectedLabelConfigData();
        }
    }

    onFormSubmit(e) {
        e.preventDefault();
        console.log("formdata", e.target);

        let properties = this.state.nodeOptions.properties;
        properties['label_type'] = this.props.selectedLabelType;
        const query_string = this.connector.requestBuilder.updateVertexById(
            this.state.nodeOptions.id, properties
        );
        this.makeQuery(query_string, {'source': 'canvas'});
    }

    // add this vertex options to

    // updateThisLabelSettings(response) {
    //     setElementColorOptionsToStorageUsingResponse(response);
    // }

    // shouldComponentUpdate(nextProps, nextState, nextContext) {
    //     return nextProps.selectedLabel !== this.props.selectedLabel || nextState.nodeOptions !== this.state.nodeOptions;
    //     // return this.shallReload;
    // }


    processResponse(response) {
        this.shallReload = true;
        console.log("=====response===", response);
        if (response.response.data && response.response.data.getOrCreateVertex) {
            // get the init data of the vertex options.
            setElementColorOptionsToStorage(response.response.data.getOrCreateVertex);
            this.setState({nodeOptions: response.response.data.getOrCreateVertex})
            this.forceUpdate();
        } else if (response.response.data && response.response.data.updateVertexById) {
            // mutation data - update the vertex options.
            setElementColorOptionsToStorage(response.response.data.updateVertexById);
            this.props.setStatusMessage("Updated options for label '" + this.props.selectedLabel + "'");
            this.setState({nodeOptions: response.response.data.updateVertexById})
            // this.props.reRenderCanvas();
            this.props.setShallReRenderD3Canvas(true);
            if (response.transporterStatusCode !== 200) {
                this.props.setErrorMessage(response.transporterStatusCode);
            }
        }
    }

    handleValueChange(e) {
        console.log("handleValueChange=====", e);
        let nodeOptions = this.state.nodeOptions;

        nodeOptions.properties[e.target.name] = e.target.value;
        console.log("<<<>>>nodeOptions", nodeOptions)
        this.setState({nodeOptions: nodeOptions});

    }

    render() {
        const selectedLabel = this.props.selectedLabel;
        // let thisNodeOptions = this.state.nodeOptions;
        // if (!thisNodeOptions.properties) {
        //     thisNodeOptions.properties = {};
        // }
        console.log("======this.state.nodeOptions ", this.state.nodeOptions)
        const defaultNodeOptions = getDefaultNodeOptions(selectedLabel,);
        console.log("========defaultNodeOptions", defaultNodeOptions)
        console.log("***");
        this.shallReload = false;

        return (
            <div className={"p-10"}>
                {this.state.nodeOptions &&

                <form onSubmit={this.onFormSubmit.bind(this)}>

                    {/*<label>Vertex Label</label>*/}
                    <input type="hidden" name={"name"} readOnly={true} spellCheck="false"
                           defaultValue={selectedLabel}/>
                    <input type="hidden" name={"label"}
                           defaultValue={selectedLabel}/>
                    {/*<input type="hidden" name={"uid"} defaultValue={selectedElementData.id}/>*/}

                    <label className={""}>Background Color</label>
                    <input type="text" name={"bgColor"} maxLength={7} minLength={7}
                           placeholder={"bgColor"} spellCheck="false"
                           onChange={this.handleValueChange.bind(this)}
                           defaultValue={this.state.nodeOptions.properties.bgColor || defaultNodeOptions.bgColor}/>

                    <label style={{"display": "none"}} className={""}>Border Color</label>
                    <input type="hidden" name={"borderColor"} maxLength={7} minLength={7}
                           placeholder={"borderColor"} spellCheck="false" readOnly={"readonly"}

                           defaultValue={this.state.nodeOptions.properties.borderColor || defaultNodeOptions.borderColor}/>

                    {/*<label className={""}>Background Image (from web)</label>*/}
                    <input type="hidden" name={"bgImageUrl"} placeholder={"bgImage (optional)"}
                           spellCheck="false"
                           onChange={this.handleValueChange.bind(this)}
                           defaultValue={this.state.nodeOptions.properties.bgImageUrl || defaultNodeOptions.bgImageUrl}/>

                    <label style={{"display": "none"}} className={""}>Background Image (from data field)</label>
                    <input type="hidden" name={"bgImagePropertyKey"}
                           spellCheck="false"
                           onChange={this.handleValueChange.bind(this)}
                           placeholder={"bgImagePropertyKey (optional)"} readOnly={"readonly"}
                           defaultValue={this.state.nodeOptions.properties.bgImagePropertyKey || defaultNodeOptions.bgImagePropertyKey}/>

                    <label className={""}>Label Property Key (from data fields)</label>
                    <input type="text" name={"labelPropertyKey"}
                           spellCheck="false"
                           placeholder={"labelPropertyKey (optional)"}
                           onChange={this.handleValueChange.bind(this)}
                           defaultValue={this.state.nodeOptions.properties.labelPropertyKey || defaultNodeOptions.labelPropertyKey}/>

                    {/*<label className={""}>Background HTML</label>*/}
                    <input type="hidden" name={"tagHtml"}
                           spellCheck="false"
                           placeholder={"tagHtml (optional)"}
                           defaultValue={this.state.nodeOptions.properties.tagHtml || ""}/>
                    <br/>
                    {/*<br/>*/}
                    <button className={"mt-10 button primary-btn"} type={"submit"}>update</button>
                    <button className={"mt-10 button "} onClick={()=> this.props.setHideVertexOptions()} type={"type"}>cancel</button>
                </form>

                }

            </div>
        )
    }

}
