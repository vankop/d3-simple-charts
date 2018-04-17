import * as d3 from 'd3';
import { each, map } from 'lodash';
import moment from 'moment';

import {AREA_CHART_TRANSITION_DURATION, textXPosition, transformAxeTextPosition, XYChartYScale} from './utils';
import legend from './legend';
import popup from './popup';

const margin = {
    top: 40,
    left: 60,
    bottom: 60,
    right: 60
};

const legendHeight = 100;
const popupWidth = 150;
const popupMargin = 20;

function minMax(timelineData) {
    if (timelineData.length === 0) {
        return null;
    }

    let minValue = timelineData[0].value;
    let maxValue = minValue;
    let minDatetime = timelineData[0].datetime;
    let maxDatetime = minDatetime;

    each(timelineData, ({ value, datetime }) => {
        if (value > maxValue) {
            maxValue = value;
        } else if (value < minValue) {
            minValue = value;
        }

        if (datetime > maxDatetime) {
            maxDatetime = datetime;
        } else if (datetime < minDatetime) {
            minDatetime = datetime;
        }
    });

    return {
        maxValue,
        minValue,
        minDatetime,
        maxDatetime
    };
}

function format(displayLevel, datetime) {
    const momentDate = moment(datetime);

    switch (displayLevel) {
    case 0:
        return momentDate.format('MMMM YYYY');
    case 1:case 2:
        return momentDate.format('DD MMMM');
    case 3:
        return momentDate.format('lll');
    default:
        return momentDate.format('HH:mm:ss');
    }
}

function computeDisplayLevel(minDatetime, maxDatetime) {
    const duration = moment.duration(maxDatetime - minDatetime);

    if (duration.asMonths() > 5) {
        return 0;
    } else if (duration.asWeeks() > 6) {
        return 1;
    } else if (duration.asDays() > 7) {
        return 2;
    } else if (duration.asHours() > 72) {
        return 3;
    } else if (duration.asHours() > 24) {
        return 4;
    }

    return 5;
}

function getXAxeTicks(displayLevel) {
    switch (displayLevel) {
        case 0:
            return d3.timeMonth.every(1);
        case 1:
            return d3.timeDay.every(4);
        case 2:
            return d3.timeDay.every(1);
        case 3:
            return d3.timeHour.every(5);
        case 4:
            return d3.timeHour.every(2);
        default:
            return d3.timeHour.every(1);
    }
}

export default function createTimelineChart(node, timeline, color, min = true) {

    const { width, height } = this.node.getBoundingClientRect();

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom - legendHeight;
    const legendY = margin.top + chartHeight + margin.bottom;

    const {
        maxDatetime,
        maxValue,
        minDatetime,
        minValue
    } = minMax(timeline);

    const y = XYChartYScale(() => ({ max: maxValue, min: minValue }), chartHeight, min);
    const x = d3
        .scaleTime()
        .domain([minDatetime, maxDatetime])
        .range([0, chartWidth]);
    const xCopy = x.copy();

    const line = d3
        .line()
        .x(({ datetime }) => x(datetime))
        .y(({ value }) => y(value));

    const xAxeDisplayLevel = computeDisplayLevel(minDatetime, maxDatetime);

    const xAxe = d3
        .axisBottom(x)
        .ticks(getXAxeTicks(xAxeDisplayLevel))
        .tickFormat(datetime => format(xAxeDisplayLevel, datetime));

    const yAxe = d3
        .axisLeft(y)
        .ticks(5);

    const bisect = d3.bisector(({ datetime }) => datetime).left;

    function isXInScope(x) {
        return x < chartWidth;
    }

    if (!this.legend) {
        this.legend = d3
            .select(this.node)
            .append('g')
            .attr('transform', `translate(${[margin.left, legendY]})`)
    }

    if (!this.d3Node) {
        this.d3Node = d3
            .select(this.node)
            .append('g')
            .attr('transform', `translate(${[margin.left, margin.top]})`);
    }

    if (!this.yAxe) {
        this.yAxe = this.d3Node.append('g');
    }

    if (!this.xAxe) {
        this.xAxe = this.d3Node
            .append('g')
            .attr('transform', `translate(0, ${chartHeight})`);
    }

    if (!this.chart) {
        this.chart = this.d3Node
            .append('svg')
            .attr('width', chartWidth)
            .attr('height', chartHeight);
    }

    if (!this.marker) {
        this.marker = this.chart.append('circle')
            .attr('r', 3)
            .style('display', 'none')
            .style('fill', color)
            .style('pointer-events', 'none')
    }

    const marker = this.marker;

    this.yAxe
        .call(yAxe);

    transformAxeTextPosition(this.xAxe.call(xAxe));

    const selfXAxe = this.xAxe;

    const path = this.chart
        .selectAll('path')
        .data([timeline]);

    const chart = this.chart;

    const zoom = d3
        .zoom()
        .scaleExtent([1, 10])
        .translateExtent([[0, 0], [chartWidth, chartHeight]])
        .extent([[0, 0], [chartWidth, chartHeight]])
        .on('zoom', function zoom() {
            const transform = d3.zoomTransform(this);
            const tempX = transform.rescaleX(xCopy);
            const domain = tempX.domain();
            const newXAxeDisplayLevel = computeDisplayLevel(moment(domain[0]).valueOf(), moment(domain[1]).valueOf());

            xAxe
                .ticks(getXAxeTicks(newXAxeDisplayLevel))
                .tickFormat(datetime => format(newXAxeDisplayLevel, datetime));

            x.domain(domain);
            transformAxeTextPosition(selfXAxe.call(xAxe));

            chart
                .selectAll('path')
                .data([timeline])
                .attr('d', line);
        });

    path
        .exit()
        .transition()
        .duration(AREA_CHART_TRANSITION_DURATION)
        .attrTween('d', function tweenD(data) {
            const interpolate = d3.interpolateArray(data, this.initial);
            return time => {
                this.data = interpolate(time);
                return line(this.data);
            };
        })
        .remove();

    path
        .enter()
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', 1.5)
        .transition()
        .duration(AREA_CHART_TRANSITION_DURATION)
        .attrTween('d', function tweenD(data) {
            this.initial = map(data, ({ datetime }) => ({ datetime, value: -10 }));
            const interpolate = d3.interpolateArray(this.initial, data);
            return time => {
                this.data = interpolate(time);
                return line(this.data);
            };
        });

    path
        .attr('stroke', color)
        .transition()
        .duration(AREA_CHART_TRANSITION_DURATION)
        .attrTween('d', function tweenD(data) {
            const interpolate = d3.interpolateArray(this.data, data);
            return time => {
                this.data = interpolate(time);
                return line(this.data);
            };
        });

    if (!this.popupsContainer) {
        this.popupsContainer = this.chart
            .append('g');
    }

    const popupsContainer = this.popupsContainer;

    function mouseMove(data) {
        const currentDatetime = x.invert(d3.mouse(this)[0]);
        const index = bisect(data, currentDatetime);
        const { value, datetime } = data[index];
        marker.attr('cy', y(value));
        marker.attr('cx', x(datetime));

        if (this._popup) {
            this._popup.remove();
            this._popup = null;
        }

        this._popup = popup({
            node: popupsContainer,
            serieName: 'legend',
            serieInfo: `${format(xAxeDisplayLevel, datetime)}: ${value}`,
            coordLeft: [chartWidth - popupMargin - popupWidth, popupMargin],
            coordRight: [popupWidth + popupMargin, popupMargin],
            color,
            isXInScope,
            width: popupWidth
        });
    }

    const eventHandler = this.chart
        .selectAll('rect')
        .data([timeline]);

    eventHandler
        .exit()
        .remove();

    eventHandler
        .enter()
        .append('rect')
        .style('pointer-events', 'visible')
        .attr('width', chartWidth)
        .attr('height', chartHeight)
        .attr('y', 0)
        .attr('x', 0)
        .attr('fill', 'none')
        .on('mouseenter', () => marker.style('display', 'inherit'))
        .on('mouseleave', function() {
            this._popup.remove();
            this._popup = null;
            marker.style('display', 'none')
        })
        .on('mousemove', mouseMove)
        .call(zoom)
        .on('wheel', () => d3.event.preventDefault());

    eventHandler
        .on('mousemove', mouseMove)
        .call(zoom.transform, d3.zoomIdentity)
        .on('.zoom', null)
        .transition()
        .duration(AREA_CHART_TRANSITION_DURATION)
        .on('end', function reBindZoom() {
            d3.select(this).call(zoom);
        });

    legend(
        this.legend,
        {
            x: 0,
            y: 0,
            height: legendHeight,
            width: chartWidth
        },
        () => color,
        ['legend']
    );
}
