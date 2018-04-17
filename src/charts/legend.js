import * as d3 from 'd3';
import { range } from 'lodash';
import { AREA_CHART_TRANSITION_DURATION } from './utils';

export const legendCircleTextPadding = 3;
export const legendInfoRadius = 4;

/**
 * @param {HTMLElement} node
 * @param {Object} param
 * @param {number} param.x
 * @param {number} param.y
 * @param {number} height
 * @param {function} colorScale
 * @param {Array<string>} values
 */
export default function createLegend(
    node,
    {
        x: marginLeft,
        y: marginTop,
        height
    },
    colorScale,
    values
) {
    const legend = node
        .selectAll('g')
        .data(values, value => value);

    const legendY = d3
        .scaleBand()
        .domain(range(values.length))
        .range([marginTop, marginTop + height])
        .padding(0.2);

    const outOfViewY = marginTop + height + 10;

    legend
        .exit()
        .remove();

    legend
        .enter()
        .append('g')
        .attr('font-family', 'sans-serif')
        .attr('font-size', '12px')
        .each(function enter(legendName, index) {
            const currentBand = d3
                .select(this);

            currentBand
                .append('circle')
                .attr('r', legendInfoRadius)
                .attr('cy', outOfViewY)
                .attr('cx', marginLeft + legendInfoRadius)
                .attr('fill', colorScale(legendName))
                .transition()
                .duration(AREA_CHART_TRANSITION_DURATION)
                .attr('cy', legendY(index) - legendInfoRadius);

            currentBand
                .append('text')
                .attr('x', marginLeft + (2 * legendInfoRadius) + legendCircleTextPadding)
                .attr('y', outOfViewY)
                .style('text-overflow', 'ellipsis')
                .text(legendName)
                .transition()
                .duration(AREA_CHART_TRANSITION_DURATION)
                .attr('y', legendY(index));
        });

    legend
        .each(function update(legendName, index) {
            const currentBand = d3
                .select(this);

            currentBand
                .select('circle')
                .attr('fill', colorScale(legendName))
                .transition()
                .duration(AREA_CHART_TRANSITION_DURATION)
                .attr('cy', legendY(index) - legendInfoRadius);

            currentBand
                .select('text')
                .transition()
                .duration(AREA_CHART_TRANSITION_DURATION)
                .attr('y', legendY(index));
        });
}
