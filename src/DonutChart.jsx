import React, { Component } from 'react';
import { range, reduce, map, min } from 'lodash';
import { select } from 'd3-selection';
import * as d3 from 'd3';
import 'd3-transition';
import PropTypes from 'prop-types';

import './BarChart.css';

const margin = {
    top: 40,
    left: 40,
    bottom: 40,
    right: 0
};

export default class DonutChart extends Component {
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
        const radius = min([chartWidth, chartHeight]) / 2;

        const colorScale = d3
            .scaleOrdinal()
            .domain(range(data.length))
            .range(d3.schemeCategory20);

        const pieShape = d3.pie()
            .sort(null)
            .value(({ value }) => value);

        const path = d3.arc()
            .outerRadius(radius)
            .innerRadius(radius / 2)
            .padAngle(0.04)
            .cornerRadius(2);

        const label = d3.arc()
            .outerRadius(radius + radius / 2)
            .innerRadius(0);

        this.chart = select(this.node)
            .append('g')
            .attr('transform', `translate(${[margin.left + chartWidth / 2, margin.top + chartHeight / 2]})`);

        const arc = this.chart
            .selectAll('g')
            .data(pieShape(data))
            .enter()
            .append('g');

        arc.append('path')
            .attr('fill', (el , index) => colorScale(index))
            .attr('stroke', '#000')
            .transition()
                .duration(1500)
                .attrTween('d', (tweeningArc) => {
                    const interpolation = d3.interpolate({startAngle: 0, endAngle: 0}, tweeningArc);
                    return moment => path(interpolation(moment));
                });

        arc.append('text')
            .attr('transform', (el) => `translate(${label.centroid(el)})`)
            .attr('dy', '0.35em')
            .attr('dx', '-0.35em')
            .text(({ value }) => value)
            .style('opacity', 0)
            .transition()
                .delay(1400)
                .duration(300)
                .style('opacity', 1);

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
