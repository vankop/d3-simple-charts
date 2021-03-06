import invariant from 'invariant';
import * as d3 from 'd3';
import {
    min,
    map,
    reduce
} from 'lodash';

import {
    colorRange,
    createMouseEnterHandler,
    createMouseLeaveHandler,
    lazyArgument,
    PIE_CHART_TRANSITION_DURATION
} from './utils';
import legend from './legend';

const legendHeight = 200;

const margin = {
    left: 60,
    right: 60,
    top: 0,
    bottom: 20
};

function midAngle({ startAngle, endAngle }) {
    return startAngle + ((endAngle - startAngle) / 2);
}

function rememberDatum(el) {
    this._current = el;
}

const keySelector = ({ data: { name } }) => name;

function arcTween(tweenArc, delay) {
    return function tween() {
        d3
            .select(this)
            .transition()
            .delay(delay)
            .attr('d', tweenArc);
    };
}

export default function createPieChart(series, settings, firstRender) {
    invariant(
        series && series.length,
        'props.series must be not empty array, got %s',
        lazyArgument(() => {
            if (series) {
                return JSON.stringify(series);
            }

            return series;
        })
    );

    const { width, height } = this.node.getBoundingClientRect();

    const format = settings && settings.format;
    const chartWidth = width - (margin.left + margin.right);
    const chartHeight = height - (margin.top + margin.bottom + legendHeight);
    const radius = min([chartWidth, chartHeight]) / 2;
    const cx = margin.left + (chartWidth / 2);
    const cy = margin.top + (chartHeight / 2);
    const labelXPosition = el => radius * 0.95 * (midAngle(el) < Math.PI ? 1 : -1);
    const sum = reduce(series, (currentSum, { data }) => currentSum + data, 0);
    const percentage = data => Math.round((data / sum) * 100);

    const color = d3
        .scaleOrdinal()
        .domain(map(series, ({ name }) => name))
        .range(colorRange);

    const pie = d3.pie().sort(null).value(({ data }) => data);

    const arc = d3.arc()
        .outerRadius(radius * 0.8)
        .innerRadius(0);

    const mouseEnterArc = d3.arc()
        .outerRadius(radius * 0.9)
        .innerRadius(0);

    const mouseEnterArcTween = arcTween(mouseEnterArc, 0);
    const mouseLeaveArcTween = arcTween(arc, 150);

    const labelArc = d3.arc()
        .outerRadius(radius * 0.9)
        .innerRadius(radius * 0.9);

    if (!this.d3Node) {
        this.d3Node = d3
            .select(this.node)
            .append('g')
            .attr('transform', `translate(${[cx, cy]})`);
    }

    if (!this.polylines) {
        this.polylines = this.d3Node
            .append('g');
    }

    if (!this.chart) {
        this.chart = this.d3Node
            .append('g');
    }

    if (!this.legend) {
        this.legend = d3
            .select(this.node)
            .append('g')
            .attr('transform', `translate(${margin.left + (cx - radius)},${margin.top + chartHeight + margin.bottom})`);
    }

    if (!this.seriesInfo) {
        this.seriesInfo = this.d3Node
            .append('g');
    }

    if (!this.popupsContainer) {
        this.popupsContainer = this.d3Node
            .append('g');
    }

    const handleMouseLeave = createMouseLeaveHandler(mouseLeaveArcTween);
    const handleMouseEnter = createMouseEnterHandler({
        animate: mouseEnterArcTween,
        handleMouseLeave,
        seriesSelector: (el) => {
            const {
                data: { name, data }
            } = el;

            return {
                name,
                data: format
                    ? format.replace(/%s/ig, data)
                    : data
            };
        },
        positionLeftSelector: arc.centroid,
        positionRightSelector: arc.centroid,
        popupsContainer: this.popupsContainer,
        colorSelector: function colorSelector() {
            return this.getAttribute('fill');
        },
        possibleWidth: width - margin.left,
        isXInScope: (value) => {
            if (value > 0) {
                return value < (radius + margin.right);
            }

            return value > (-radius - margin.left);
        }
    });

    const g = this.chart
        .selectAll('path')
        .data(pie(series), keySelector);

    g
        .exit()
        .transition()
        .duration(PIE_CHART_TRANSITION_DURATION)
        .attrTween('d', (el) => {
            const { endAngle } = el;
            const interpolation = d3.interpolate(el, { startAngle: endAngle, endAngle });
            return moment => arc(interpolation(moment));
        })
        .remove();

    if (firstRender) {
        g
            .enter()
            .append('path')
            .attr('fill', el => color(keySelector(el)))
            .attr('stroke', '#fff')
            .each(rememberDatum)
            .on('touchstart', handleMouseEnter)
            .on('touchend', handleMouseLeave)
            .on('mouseenter', handleMouseEnter)
            .on('mouseleave', handleMouseLeave)
            .transition()
            .duration(PIE_CHART_TRANSITION_DURATION)
            .attrTween('d', (el) => {
                const interpolation = d3.interpolate({ startAngle: 0, endAngle: 0 }, el);
                return moment => arc(interpolation(moment));
            });
    } else {
        g
            .enter()
            .append('path')
            .attr('fill', el => color(keySelector(el)))
            .attr('stroke', '#fff')
            .each(rememberDatum)
            .on('touchstart', handleMouseEnter)
            .on('touchend', handleMouseLeave)
            .on('mouseenter', handleMouseEnter)
            .on('mouseleave', handleMouseLeave)
            .transition()
            .duration(PIE_CHART_TRANSITION_DURATION)
            .attrTween('d', (el) => {
                const { endAngle } = el;
                const interpolation = d3.interpolate({ startAngle: endAngle, endAngle }, el);
                return moment => arc(interpolation(moment));
            });
    }

    g
        .attr('fill', el => color(keySelector(el)))
        .transition()
        .duration(PIE_CHART_TRANSITION_DURATION)
        .attrTween('d', function tween(el) {
            const interpolate = d3.interpolate(this._current, el);

            return (moment) => {
                this._current = interpolate(moment);
                return arc(this._current);
            };
        });

    const polyline = this.polylines
        .selectAll('polyline')
        .data(pie(series), keySelector);

    polyline
        .exit()
        .transition()
        .duration(PIE_CHART_TRANSITION_DURATION)
        .attrTween('points', (el) => {
            const interpolate = d3
                .interpolate(el, { startAngle: el.endAngle, endAngle: el.endAngle });
            return (moment) => {
                const current = interpolate(moment);
                const arcCentroid = arc.centroid(current);
                const labelCentroid = labelArc.centroid(current);

                return [
                    arcCentroid,
                    labelCentroid,
                    [labelXPosition(current), labelCentroid[1]]
                ];
            };
        })
        .styleTween('opacity', () => moment => 1 - moment)
        .remove();

    polyline
        .enter()
        .append('polyline')
        .attr('stroke', el => color(keySelector(el)))
        .attr('fill', 'none')
        .each(rememberDatum)
        .text(({ name }) => name)
        .attr('points', (el) => {
            const arcCentroid = arc.centroid(el);
            const labelCentroid = labelArc.centroid(el);
            return [
                arcCentroid,
                labelCentroid,
                [labelXPosition(el), labelCentroid[1]]
            ];
        })
        .style('opacity', 0)
        .transition()
        .duration(PIE_CHART_TRANSITION_DURATION)
        .style('opacity', 1);

    polyline
        .attr('stroke', el => color(keySelector(el)))
        .transition()
        .duration(PIE_CHART_TRANSITION_DURATION)
        .attrTween(
            'points',
            function tweenPoints(el) {
                const interpolateElement = d3.interpolate(this._current, el);

                return (moment) => {
                    this._current = interpolateElement(moment);
                    const arcCentroid = arc.centroid(this._current);
                    const labelCentroid = labelArc.centroid(this._current);

                    return [
                        arcCentroid,
                        labelCentroid,
                        [labelXPosition(this._current), labelCentroid[1]]
                    ];
                };
            }
        );

    const text = this.seriesInfo
        .selectAll('text')
        .data(pie(series), keySelector);

    text
        .exit()
        .transition()
        .duration(PIE_CHART_TRANSITION_DURATION)
        .attrTween('transform', (el) => {
            const interpolate = d3
                .interpolate(el, { startAngle: el.endAngle, endAngle: el.endAngle });
            return (moment) => {
                const current = interpolate(moment);
                const labelCentroid = labelArc.centroid(current);

                return `translate(${[labelXPosition(current), labelCentroid[1]]})`;
            };
        })
        .styleTween('opacity', () => moment => 1 - moment)
        .styleTween('text-anchor', (el) => {
            const interpolate = d3.interpolate(el, { startAngle: 0, endAngle: el.endAngle });
            return (moment) => {
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
            const labelCentroid = labelArc.centroid(el);
            return `translate(${[labelXPosition(el), labelCentroid[1]]})`;
        })
        .style('text-anchor', (el) => {
            if (midAngle(el) < Math.PI) {
                return 'start';
            }
            return 'end';
        })
        .style('opacity', 0)
        .transition()
        .duration(PIE_CHART_TRANSITION_DURATION)
        .style('opacity', 1);

    text
        .text(({ value }) => `${percentage(value)}%`)
        .transition()
        .duration(PIE_CHART_TRANSITION_DURATION)
        .attrTween('transform', function tweenTransform(el) {
            const interpolate = d3.interpolate(this._current, el);

            return (moment) => {
                this._current = interpolate(moment);

                const labelCentroid = labelArc.centroid(this._current);
                return `translate(${[labelXPosition(this._current), labelCentroid[1]]})`;
            };
        })
        .styleTween('text-anchor', function tweenAnchor(el) {
            const interpolate = d3.interpolate(this._current, el);
            return (moment) => {
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
        map(series, 'name')
    );
}
