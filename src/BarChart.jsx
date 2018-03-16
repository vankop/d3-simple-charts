import React, { Component } from 'react';
import { range, maxBy, map } from 'lodash';
import { scaleBand, scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { axisLeft, axisBottom } from 'd3-axis';
import 'd3-transition';
import PropTypes from 'prop-types';

import './BarChart.css';

const margin = {
    top: 40,
    left: 40,
    bottom: 40,
    right: 0
};

export default class BarChart extends Component {
    static propTypes = {
        data: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.any,
            value: PropTypes.number,
            legend: PropTypes.string
        })).isRequired,
        legend: PropTypes.string,
        width: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]).isRequired,
        height: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]).isRequired
    };

    constructor() {
        super();

        this.setRef = this.setRef.bind(this);
    }

    componentDidMount() {
        if (this.node) {
            this.createChart();
        }
    }

    createChart() {
        const {
            data
        } = this.props;

        const { width, height } = this.node.getBoundingClientRect();

        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const x = scaleBand()
            .domain(map(data, ({ id }) => id))
            .range([0, chartWidth])
            .padding(.5);

        const { value: max } = maxBy(data, 'value');

        const y = scaleLinear()
            .domain([0, max])
            .range([chartHeight, 0]);

        const yAxe = axisLeft(y)
            .tickValues([2, 10, 100]);
        const xAxe = axisBottom(x).tickFormat(id => data[id].value);

        this.d3Node = select(this.node)
            .append('g')
            .attr('transform', `translate(${[margin.left, margin.top]})`);

        this.d3Node
            .append('g')
            .call(yAxe);

        this.d3Node
            .append('g')
            .attr('transform', `translate(0, ${height - margin.bottom - margin.top})`)
            .call(xAxe);

        this.chart = this.d3Node
            .append('svg')
            .attr('height', chartHeight);

        this.chart
            .selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('width', x.bandwidth())
            .attr('x', ({ id }) => x(id))
            .attr('y', chartHeight)
            .attr('height', ({ value }) => chartHeight - y(value));

        this.chart
            .selectAll('rect')
            .transition()
            .duration(500)
            .attr('y', ({ value }) => y(value));
    }

    setRef(domNode) {
        this.node = domNode;
    }

    render() {
        const { width, height } = this.props;
        return (
            <svg ref={this.setRef} width={width} height={height} />
        );
    }
}
