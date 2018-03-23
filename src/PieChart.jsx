import React, { Component } from 'react';
import PropTypes from 'prop-types';
import invariant from 'invariant';
import * as d3 from 'd3';
import {
    lazyArgument,
    TRANSITION_DURATION
} from './utils';
import { min, range, map, reduce } from 'lodash';
import legend from './legend';

const legendHeight = 200;

const margin = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 20
};

function midAngle({ startAngle, endAngle }){
    return startAngle + ((endAngle - startAngle) / 2);
}

function rememberDatum(el) {
    this._current = el;
}

const keySelector = ({ data: { name } }) => name;

export default class PieChart extends Component {
    static propTypes = {
        values: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string,
            data: PropTypes.arrayOf(PropTypes.number),
            settings: PropTypes.shape({
                format: PropTypes.string
            })
        })),
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
            this.createChart(this.props, true)
        }
    }

    componentWillReceiveProps(props) {
        const { values } = props;
        if (this.node && values !== this.props.values) {
            this.createChart(props)
        }
    }

    setRef(node) {
        this.node = node;
    }

    createChart(props, onMount) {
        const {
            values
        } = props;

        invariant(
            values && values.length,
            'props.values must be not empty array, got %s',
            lazyArgument(() => values ? JSON.stringify(values) : values)
        );

        const { width, height } = this.node.getBoundingClientRect();

        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom - legendHeight;
        const radius = min([chartWidth, chartHeight]) / 2;
        const cx = margin.left + chartWidth / 2;
        const cy = margin.top + chartHeight / 2;
        const labelXPosition = el => radius * 0.95 * (midAngle(el) < Math.PI ? 1 : -1);
        const sum = reduce(values, (currentSum, { data }) => currentSum + data, 0);
        const percentage = data => Math.round(data / sum * 100);

        const color = d3
            .scaleOrdinal()
            .domain(map(values, ({ name }) => name))
            .range(d3.schemeCategory20);

        const pie = d3.pie().sort(null).value(({ data }) => data);

        const arc = d3.arc()
            .outerRadius(radius * .8)
            .innerRadius(0);

        const labelArc = d3.arc()
            .outerRadius(radius * .9)
            .innerRadius(radius * .9);

        if (!this.d3Node) {
            this.d3Node = d3
                .select(this.node)
                .append('g')
                .attr('transform', `translate(${[cx, cy]})`);
        }

        if (!this.chart) {
            this.chart = this.d3Node
                .append('g');
        }

        if (!this.legend) {
            this.legend = d3
                .select(this.node)
                .append('g')
                .attr('transform', `translate(${margin.left + (cx - radius)},${margin.top + chartHeight + margin.bottom})`)
        }

        if (!this.polygons) {
            this.polygons = this.d3Node
                .append('g');
        }

        if (!this.valuesInfo) {
            this.valuesInfo = this.d3Node
                .append('g');
        }

        const g = this.chart
            .selectAll('path')
            .data(pie(values), keySelector);

        g
            .exit()
            .transition()
            .duration(TRANSITION_DURATION * 2)
            .attrTween('d', (el) => {
                const { endAngle } = el;
                const interpolation = d3.interpolate(el, { startAngle: endAngle, endAngle });
                return moment => arc(interpolation(moment));
            })
            .remove();

        if (onMount) {
            g
                .enter()
                .append('path')
                .attr('fill', el => color(keySelector(el)))
                .attr('stroke', '#fff')
                .each(rememberDatum)
                .transition()
                .duration(TRANSITION_DURATION * 2)
                .attrTween('d', (tweeningArc) => {
                    const interpolation = d3.interpolate({startAngle: 0, endAngle: 0}, tweeningArc);
                    return moment => arc(interpolation(moment));
                });
        } else {
            g
                .enter()
                .append('path')
                .attr('fill', el => color(keySelector(el)))
                .attr('stroke', '#fff')
                .each(rememberDatum)
                .transition()
                .duration(TRANSITION_DURATION * 2)
                .attrTween('d', (el) => {
                    const { endAngle } = el;
                    const interpolation = d3.interpolate({ startAngle: endAngle, endAngle }, el);
                    return moment => arc(interpolation(moment));
                });
        }

        g
            .attr('fill', el => color(keySelector(el)))
            .transition()
            .duration(TRANSITION_DURATION * 2)
            .attrTween('d', function (el) {
                const interpolate = d3.interpolate(this._current, el);

                return (moment) => {
                    this._current = interpolate(moment);
                    return arc(this._current);
                };
            });

        const polygon = this.polygons
            .selectAll('polyline')
            .data(pie(values), keySelector);

        polygon
            .exit()
            .transition()
            .duration(TRANSITION_DURATION * 2)
            .attrTween('points', (el) => {
                const interpolate = d3.interpolate(el, { startAngle: el.endAngle, endAngle: el.endAngle });
                return moment => {
                    const current = interpolate(moment);
                    const arcCentroid = arc.centroid(current);
                    const labelCentroid = labelArc.centroid(current);
                    const [labelX, labelY] = labelCentroid;

                    return [
                        arcCentroid,
                        labelCentroid,
                        [labelXPosition(current), labelY]
                    ];
                }
            })
            .styleTween('opacity', () => moment => 1 - moment)
            .remove();

        polygon
            .enter()
            .append('polyline')
            .attr('stroke', el => color(keySelector(el)))
            .attr('fill', 'none')
            .each(rememberDatum)
            .text(({ name }) => name)
            .transition()
            .duration(TRANSITION_DURATION * 2)
            .attr('points', (el) => {
                const arcCentroid = arc.centroid(el);
                const labelCentroid = labelArc.centroid(el);
                const [labelX, labelY] = labelCentroid;

                return [
                    arcCentroid,
                    labelCentroid,
                    [labelXPosition(el), labelY]
                ];
            });

        polygon
            .transition()
            .duration(TRANSITION_DURATION * 2)
            .attrTween(
                'points',
                function (el) {
                    const interpolateElement = d3.interpolate(this._current, el);

                    return (moment) => {
                        this._current = interpolateElement(moment);
                        const arcCentroid = arc.centroid(this._current);
                        const labelCentroid = labelArc.centroid(this._current);
                        const [labelX, labelY] = labelCentroid;

                        return [
                            arcCentroid,
                            labelCentroid,
                            [labelXPosition(this._current), labelY]
                        ];
                    };
                }
            );

        const text = this.valuesInfo
            .selectAll('text')
            .data(pie(values), keySelector);

        text
            .exit()
            .transition()
            .duration(TRANSITION_DURATION * 2)
                .attrTween('transform', (el) => {
                    const interpolate = d3.interpolate(el, { startAngle: el.endAngle, endAngle: el.endAngle });
                    return moment => {
                        const current = interpolate(moment);
                        const [labelX, labelY] = labelArc.centroid(current);

                        return `translate(${[labelXPosition(current), labelY]})`;
                    }
                })
                .styleTween('opacity', () => moment => 1 - moment)
                .styleTween('text-anchor', function (el) {
                    const interpolate = d3.interpolate(el, { startAngle: 0, endAngle: el.endAngle });
                    return moment => {
                        const current = interpolate(moment);

                        return midAngle(current) < Math.PI ? 'start' : 'end';
                    };
                })
            .remove();

        text
            .enter()
            .append('text')
            .attr('dy', '0.35em')
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .each(rememberDatum)
            .text(({ value }) => `${percentage(value)}%`)
            .attr('transform', (el) => {
                const [labelX, labelY] = labelArc.centroid(el);
                return `translate(${[labelXPosition(el), labelY]})`
            })
            .style('text-anchor', el => midAngle(el) < Math.PI ? 'start' : 'end')
            .style('opacity', 0)
            .transition()
            .duration(TRANSITION_DURATION * 2)
                .style('opacity', 1);

        text
            .text(({ value }) => `${percentage(value)}%`)
            .transition()
            .duration(TRANSITION_DURATION * 2)
                .attrTween('transform', function (el) {
                    const interpolate = d3.interpolate(this._current, el);

                    return moment => {
                        this._current = interpolate(moment);

                        const [labelX, labelY] = labelArc.centroid(this._current);
                        return `translate(${[labelXPosition(this._current), labelY]})`;
                    };
                })
                .styleTween('text-anchor', function (el) {
                    const interpolate = d3.interpolate(this._current, el);
                    return moment => {
                        this._current = interpolate(moment);

                        return midAngle(this._current) < Math.PI ? 'start' : 'end';
                    };
                });

        legend(
            this.legend,
            {
                x: 0,
                y: 0,
                height: legendHeight,
                width
            },
            color,
            map(values, 'name')
        );
    }

    render() {
        const {
            width,
            height
        } = this.props;

        return (
            <svg ref={this.setRef} width={width} height={height} />
        );
    }
}

