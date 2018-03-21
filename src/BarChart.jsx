import React, { Component } from 'react';
import { range, map, each } from 'lodash';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

import './BarChart.css';

const margin = {
    top: 40,
    left: 40,
    bottom: 60,
    right: 0
};

const legendCircleTextPadding = 3;
const legendInfoRadius = 4;

const category10 = d3.schemeCategory10;

function minMax(seriesData) {
    if (seriesData.length === 0) {
        return null;
    }

    let max = seriesData[0][0];
    let min = max;

    each(seriesData, (data) => {
        each(data, (value) => {
            if (value > max) {
                max = value;
            }
            if (value < min) {
                min = value;
            }
        })
    });

    return { max, min };
}

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
        ])
    };

    static defaultProps = {
        min: 0
    };

    constructor() {
        super();

        this.setRef = this.setRef.bind(this);
    }

    componentWillReceiveProps(props) {
        const { series } = props;
        if (series !== this.props.series) {
            this.createChart(props)
        }
    }

    componentDidMount() {
        if (this.node) {
            this.createChart(this.props);
        }
    }

    createChart(props) {
        const {
            series,
            xAxis,
            min
        } = props;

        if (series.length === 0) {
            return;
        }

        const seriesData = [];

        for(let i = 0; i < series[0].data.length; i++) {
            const data = map(series, serie => serie.data[i]);
            seriesData.push(data);
        }

        const seriesLegend = map(series, ({ name }) => name);

        const { width, height } = this.node.getBoundingClientRect();

        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const indexes = range(seriesData.length);

        const x = d3.scaleBand()
            .domain(indexes)
            .range([0, chartWidth])
            .padding(.2);

        const { max: maxValue, min: minValue } = minMax(seriesData);

        const max = maxValue / 0.75;

        const y = d3.scaleLinear()
            .domain([min === true ? minValue / 2 : min || 0, max])
            .range([chartHeight, 0]);

        const color = d3.scaleOrdinal()
            .domain(range(series.length))
            .range(category10);

        const yAxe = d3.axisLeft(y).ticks(5);
        const xAxe = d3.axisBottom(x)
            .tickValues(indexes)
            .tickFormat(index => xAxis[index]);

        if (!this.legend) {
            this.legend = d3.select(this.node)
                .append('g')
                .attr('transform', `translate(${margin.left},0)`);
        }

        if (!this.d3Node) {
            this.d3Node = d3.select(this.node)
                .append('g')
                .attr('transform', `translate(${[margin.left, margin.top]})`);
        }

        if (!this.chart) {
            this.chart = this.d3Node
                .append('svg')
                .attr('height', chartHeight);
        }

        if (!this.yAxe) {
            this.yAxe = this.d3Node.append('g');
        }

        if (!this.xAxe) {
            this.xAxe = this.d3Node
                .append('g')
                .attr('transform', `translate(0, ${height - margin.bottom - margin.top})`);
        }

        this.yAxe
            .call(yAxe);

        this.xAxe
            .call(xAxe)
            .selectAll('text')
            .attr("x", function () {
                return -10-this.textContent.length;
            })
            .attr("transform", "rotate(-40)");

        const seriesWidth = x.bandwidth() / series.length;

        const g = this.chart
            .selectAll('g')
            .data(seriesData);

        g
            .exit()
            .remove();

        g
            .each(function (series, index) {
                const rectangles = d3
                    .select(this)
                    .selectAll('rect')
                    .data(series);

                rectangles
                    .exit()
                    .transition()
                    .duration(750)
                    .attr('y', chartHeight)
                    .remove();

                rectangles
                    .attr('fill', (el, index) => color(index))
                    .transition()
                    .duration(750)
                    .tween("updateExisting", function (el, seriesIndex) {
                        const node = this;
                        const heightInterpolator = d3.interpolateString(node.getAttribute('height'), chartHeight - y(el));
                        const widthInterpolator = d3.interpolateString(node.getAttribute('width'), seriesWidth);
                        const xInterpolator = d3.interpolateString(node.getAttribute('x'), x(index) + seriesWidth * seriesIndex);
                        const yInterpolator = d3.interpolateString(node.getAttribute('y'), y(el));
                        return (t) => {
                            node.setAttribute('height', heightInterpolator(t));
                            node.setAttribute('width', widthInterpolator(t));
                            node.setAttribute('x', xInterpolator(t));
                            node.setAttribute('y', yInterpolator(t));
                        };
                    });

                rectangles
                    .enter()
                    .append('rect')
                    .attr('width', seriesWidth)
                    .attr('fill', (el, index) => color(index))
                    .attr('x', (el, seriesIndex) => x(index) + seriesWidth * seriesIndex)
                    .attr('y', chartHeight)
                    .attr('height', (el) => chartHeight - y(el))
                    .transition()
                    .duration(750)
                    .attr('y', (el) => y(el));
            });

        g
            .enter()
            .append('g')
            .each(function (series, index) {
                const rectangles = d3
                    .select(this)
                    .selectAll('rect')
                    .data(series);

                rectangles
                    .enter()
                        .append('rect')
                        .attr('width', seriesWidth)
                        .attr('fill', (el, index) => color(index))
                        .attr('x', (el, seriesIndex) => x(index) + seriesWidth * seriesIndex)
                        .attr('y', chartHeight)
                        .attr('height', (el) => chartHeight - y(el))
                    .transition()
                    .duration(750)
                    .attr('y', (el) => y(el));
            });

        const legendX = d3
            .scaleBand()
            .domain(range(series.length))
            .range([0, chartWidth])
            .padding(.2);

        const marginTop = margin.top;

        const legend =
            this.legend
                .selectAll('g')
                .data(seriesLegend);

        legend
            .exit()
            .remove();

        legend
            .each(function (legend, index) {
                const currentBand = d3
                    .select(this);

                currentBand
                    .select('circle')
                    .attr('fill', color(index))
                    .transition()
                    .duration(750)
                    .attr('cx', legendX(index));

                currentBand
                    .select('text')
                    .transition()
                    .duration(750)
                    .attr('x', legendX(index) + 2 * legendInfoRadius + legendCircleTextPadding);
            });

        legend
            .enter()
            .append('g')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .each(function (legend, index) {
                const currentBand = d3
                    .select(this);

                currentBand
                    .append('circle')
                    .attr('r', legendInfoRadius)
                    .attr('cy', -legendInfoRadius)
                    .attr('cx', legendX(index))
                    .attr('fill', color(index))
                    .transition()
                    .duration(750)
                    .attr('cy', marginTop / 2);

                currentBand
                    .append('text')
                    .attr('x', legendX(index) + 2 * legendInfoRadius + legendCircleTextPadding)
                    .attr('y', -legendInfoRadius)
                    .text(legend)
                    .transition()
                    .duration(750)
                    .attr('y', marginTop / 2 + legendInfoRadius);
            });
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
