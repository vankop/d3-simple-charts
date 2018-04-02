import React, { Component } from 'react';
import { range, map, each, every } from 'lodash';
import PropTypes from 'prop-types';

import createBarChart from './charts/BarChart';

export default class BarChart extends Component {
    static propTypes = {
        series: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string,
            data: PropTypes.arrayOf(PropTypes.number)
        })).isRequired,
        xAxis: PropTypes.arrayOf(PropTypes.string).isRequired,
        width: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]).isRequired,
        height: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]).isRequired,
        min: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.bool
        ]),
        style: PropTypes.object
    };

    static defaultProps = {
        min: 0,
        series: []
    };

    constructor() {
        super();

        this.createChart = createBarChart.bind(this);
        this.setRef = this.setRef.bind(this);
    }

    componentDidMount() {
        if (this.node) {
            const { min, xAxis, series } = this.props;
            this.createChart(series, xAxis, min);
        }
    }

    componentWillReceiveProps(props) {
        const { series, min, xAxis } = props;
        if (this.node && series !== this.props.series) {
            this.createChart(series, xAxis, min);
        }
    }

    setRef(domNode) {
        this.node = domNode;
    }

    render() {
        const { width, height, style } = this.props;
        return (
            <svg
                ref={this.setRef}
                width={width}
                height={height}
                style={style}
            />
        );
    }
}
