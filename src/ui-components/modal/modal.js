import React from "react";
import "./modal.scss";
import PropTypes from "prop-types";

export default class GEModal extends React.Component {

    static propTypes = {
        title: PropTypes.string,
        children: PropTypes.any,
        style: PropTypes.object
    }

    render() {
        return (
            <div className={"ge-modal"} style={this.props.style}>
                {this.props.title ? (
                    <div className={"ge-modal-header"}>
                        <h4>{this.props.title}</h4>
                    </div>
                ) : (
                    <span/>
                )}

                <div className={"ge-modal-body"}>{this.props.children}</div>
            </div>
        );
    }
}
