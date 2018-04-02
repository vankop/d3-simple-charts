import React, { Component } from 'react';
import PropTypes from 'prop-types';

import createPieChart from './charts/PieChart';

export default class PieChart extends Component {
    static propTypes = {
        series: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            data: PropTypes.number.isRequired
        })).isRequired,
        settings: PropTypes.object,
        width: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]).isRequired,
        height: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]).isRequired,
        style: PropTypes.object
    };

    constructor() {
        super();

        this.createChart = createPieChart.bind(this);
        this.setRef = this.setRef.bind(this);
    }

    componentDidMount() {
        if (this.node) {
            const {
                series,
                settings
            } = this.props;
            this.createChart(series, settings, true);
        }
    }

    componentWillReceiveProps(props) {
        const { series, settings } = props;
        if (this.node && series !== this.props.series) {
            this.createChart(series, settings);
        }
    }

    setRef(node) {
        this.node = node;
    }

    render() {
        const {
            width,
            height,
            style
        } = this.props;

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

