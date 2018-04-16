import React, { Component } from 'react';
import PropTypes from 'prop-types';

import createTimelineChart from './charts/TimelineChart';

export default class TimelineChart extends Component {
    static propTypes = {
        min: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.number
        ]).isRequired,
        timeline: PropTypes.arrayOf(PropTypes.shape({
            value: PropTypes.number,
            datetime: PropTypes.number
        })),
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired
    };

    static defaultProps = {
        timeline: []
    };

    constructor() {
        super();

        this.getRef = this.getRef.bind(this);
    }

    componentDidMount() {
        if (this.node) {
            createTimelineChart(this.node, this.props.timeline, this.props.min);
        }
    }

    shouldComponentUpdate() {
        return false;
    }

    getRef(ref) {
        this.node = ref;
    }

    render() {
        const {
            width,
            height
        } = this.props;

        return <svg ref={this.getRef} width={width} height={height} />;
    }
}
