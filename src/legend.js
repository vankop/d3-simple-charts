import * as d3 from 'd3';
import {range} from 'lodash';
import {BAR_CHART_TRANSITION_DURATION} from './utils';

const legendCircleTextPadding = 3;
const legendInfoRadius = 4;

export default function createLegend(
    node,
    {
        x: marginLeft,
        y: marginTop,
        height,
        width
    },
    colorScale,
    values
) {
    const legend = node
        .selectAll('g')
        .data(values);

    const legendY = d3
        .scaleBand()
        .domain(range(values.length))
        .range([marginTop, marginTop + height])
        .padding(.2);

    const outOfViewY = marginTop + height + 10;

    legend
        .exit()
        .remove();

    legend
        .each(function (legend, index) {
            const currentBand = d3
                .select(this);

            currentBand
                .select('circle')
                .attr('fill', colorScale(legend))
                .transition()
                .duration(BAR_CHART_TRANSITION_DURATION)
                .attr('cy', legendY(index) - legendInfoRadius);

            currentBand
                .select('text')
                .transition()
                .duration(BAR_CHART_TRANSITION_DURATION)
                .attr('y', legendY(index));
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
                .attr('cy', outOfViewY)
                .attr('cx', marginLeft + legendInfoRadius)
                .attr('fill', colorScale(legend))
                .transition()
                .duration(BAR_CHART_TRANSITION_DURATION)
                .attr('cy', legendY(index) - legendInfoRadius);

            currentBand
                .append('text')
                .attr('x', marginLeft + 2 * legendInfoRadius + legendCircleTextPadding)
                .attr('y', outOfViewY)
                .style('text-overflow', 'ellipsis')
                .text(legend)
                .transition()
                .duration(BAR_CHART_TRANSITION_DURATION)
                .attr('y', legendY(index));
        });
}
