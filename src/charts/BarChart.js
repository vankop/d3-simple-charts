import {
    range,
    map,
    each,
    every
} from 'lodash';
import * as d3 from 'd3';
import invariant from 'invariant';

import legend from './legend';
import {
    colorRange,
    lazyArgument,
    BAR_CHART_TRANSITION_DURATION,
    createMouseLeaveHandler,
    createMouseEnterHandler,
    XYChartYScale,
    mapBarChartDataToSeriesData,
    textXPosition
} from './utils';

const margin = {
    top: 40,
    left: 60,
    bottom: 60,
    right: 60
};

const legendHeight = 100;

const keySelector = ({ name }) => name;

function minMax(seriesData) {
    if (seriesData.length === 0) {
        return null;
    }

    let max = seriesData[0][0].data;
    let min = max;

    each(seriesData, (series) => {
        each(series, ({ data }) => {
            if (data > max) {
                max = data;
            }
            if (data < min) {
                min = data;
            }
        });
    });

    return { max, min };
}

export default function createBarChart(series, xAxis, min) {
    invariant(
        series && series.length > 0,
        'props.series must be not empty array, got %s',
        lazyArgument(() => {
            if (series) {
                return JSON.stringify(series);
            }
            return series;
        })
    );

    const dataLength = series[0].data.length;

    invariant(
        every(series, ({ data }) => data.length === dataLength),
        'data.length must be equal for every serie, got: %s',
        lazyArgument(() => JSON.stringify(series))
    );

    invariant(
        xAxis && xAxis.length === dataLength,
        'data.length must be equal xAxis.length, got data.length:%s and xAxis.length:%s',
        dataLength,
        xAxis && xAxis.length
    );

    if (series.length === 0) {
        return;
    }

    const seriesData = mapBarChartDataToSeriesData(series);

    const seriesLegend = map(series, ({ name }) => name);

    const { width, height } = this.node.getBoundingClientRect();

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom - legendHeight;
    const legendY = margin.top + chartHeight + margin.bottom;

    const indexes = range(dataLength);

    const x = d3.scaleBand()
        .domain(indexes)
        .range([0, chartWidth])
        .padding(0.2);

    const y = XYChartYScale(() => minMax(seriesData), chartHeight, min);

    const color = d3.scaleOrdinal()
        .domain(seriesLegend)
        .range(colorRange);

    const yAxe = d3.axisLeft(y).ticks(5);
    const xAxe = d3.axisBottom(x)
        .tickValues(indexes)
        .tickFormat(index => xAxis[index]);

    if (!this.legend) {
        this.legend = d3.select(this.node)
            .append('g')
            .attr('transform', `translate(${margin.left},${legendY})`);
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
            .attr('transform', `translate(0, ${chartHeight})`);
    }

    if (!this.popupsContainer) {
        this.popupsContainer = this.d3Node
            .append('g');
    }

    const handleMouseLeave = createMouseLeaveHandler(function onLeave() {
        d3
            .select(this)
            .attr('stroke-width', 1);
    });

    const handleMouseEnter = createMouseEnterHandler({
        animate: function onEnter() {
            d3
                .select(this)
                .attr('stroke-width', 3);
        },
        seriesSelector: el => el,
        handleMouseLeave,
        positionLeftSelector: function selectLeftPosition() {
            return [Number(this.getAttribute('x')), Number(this.getAttribute('y'))];
        },
        positionRightSelector: function selectRightPosition() {
            return [Number(this.getAttribute('width')) + Number(this.getAttribute('x')), Number(this.getAttribute('y'))];
        },
        popupsContainer: this.popupsContainer,
        colorSelector: function colorSelector() {
            return this.getAttribute('fill');
        },
        isXInScope: value => value < width - margin.left
    });

    const seriesWidth = x.bandwidth() / series.length;

    const g = this.chart
        .selectAll('g')
        .data(seriesData);

    g
        .exit()
        .remove();

    g
        .enter()
        .append('g')
        .each(function enter(seriesGroup, index) {
            const rectangles = d3
                .select(this)
                .selectAll('rect')
                .data(seriesGroup, keySelector);

            rectangles
                .enter()
                .append('rect')
                .attr('width', seriesWidth)
                .attr('stroke', '#666')
                .attr('fill', el => color(keySelector(el)))
                .attr('x', (el, seriesIndex) => x(index) + (seriesWidth * seriesIndex))
                .attr('y', chartHeight)
                .attr('height', ({ data }) => chartHeight - y(data))
                .on('touchstart', handleMouseEnter)
                .on('touchend', handleMouseLeave)
                .on('mouseenter', handleMouseEnter)
                .on('mouseleave', handleMouseLeave)
                .transition()
                .duration(BAR_CHART_TRANSITION_DURATION)
                .attr('y', ({ data }) => y(data));
        });

    g
        .each(function update(seriesGroup, index) {
            const rectangles = d3
                .select(this)
                .selectAll('rect')
                .data(seriesGroup, keySelector);

            rectangles
                .exit()
                .transition()
                .duration(BAR_CHART_TRANSITION_DURATION)
                .attr('y', chartHeight)
                .remove();

            rectangles
                .enter()
                .append('rect')
                .attr('width', seriesWidth)
                .attr('fill', el => color(keySelector(el)))
                .attr('stroke', '#666')
                .attr('x', (el, seriesIndex) => x(index) + (seriesWidth * seriesIndex))
                .attr('y', chartHeight)
                .attr('height', ({ data }) => chartHeight - y(data))
                .on('touchstart', handleMouseEnter)
                .on('touchend', handleMouseLeave)
                .on('mouseenter', handleMouseEnter)
                .on('mouseleave', handleMouseLeave)
                .transition()
                .duration(BAR_CHART_TRANSITION_DURATION)
                .attr('y', ({ data }) => y(data));

            rectangles
                .attr('fill', el => color(keySelector(el)))
                .transition()
                .duration(BAR_CHART_TRANSITION_DURATION)
                .tween('updateExisting', function updateExisting(el, seriesIndex) {
                    const node = this;
                    const { data } = el;
                    const heightInterpolator = d3.interpolateString(node.getAttribute('height'), chartHeight - y(data));
                    const widthInterpolator = d3.interpolateString(node.getAttribute('width'), seriesWidth);
                    const xInterpolator = d3.interpolateString(node.getAttribute('x'), x(index) + (seriesWidth * seriesIndex));
                    const yInterpolator = d3.interpolateString(node.getAttribute('y'), y(data));
                    return (t) => {
                        node.setAttribute('height', heightInterpolator(t));
                        node.setAttribute('width', widthInterpolator(t));
                        node.setAttribute('x', xInterpolator(t));
                        node.setAttribute('y', yInterpolator(t));
                    };
                });
        });

    this.yAxe
        .call(yAxe);

    this.xAxe
        .call(xAxe)
        .selectAll('text')
        .attr('x', textXPosition)
        .attr('transform', 'rotate(-40)');

    legend(
        this.legend,
        {
            x: 0,
            y: 0,
            height: legendHeight,
            width: chartWidth
        },
        color,
        seriesLegend
    );
}
