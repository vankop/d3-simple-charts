import * as d3 from 'd3';
import { max } from 'lodash';

import { legendCircleTextPadding, legendInfoRadius } from './legend';

const extraHeight = 30;
const border = 1;
const paddingInRect = 5;
const baseWidth = 80;

/**
 * @param {HTMLElement} node
 * @param {string} serieName
 * @param {string} serieInfo
 * @param {[number, number]} coord
 * @param {string} color
 * @param {function} onMouseLeave
 * @return {Object}
 */
export default function popup(node, serieName, serieInfo, coord, color, onMouseLeave) {
    const d3Node = node
        .append('g')
            .style('cursor', 'default')
            .attr('transform', `translate(${coord})`);

    const isPopupContent = (domNode) => {
        let result = false;

        d3Node.each(function () {
            result = this.contains(domNode)
        });

        return result;
    };

    const handleMouseLeave = () => {
        if (!isPopupContent(d3.event.relatedTarget)) {
            onMouseLeave()
        }
    };

    d3Node
        .append('rect')
        .on('mouseleave', handleMouseLeave)
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill', '#fff')
        .attr('stroke', '#000')
        .attr('height', legendInfoRadius * 2 + extraHeight + border)
        .attr('width', baseWidth + max([serieName.length, serieInfo.length]));

    d3Node
        .append('circle')
        .on('mouseleave', handleMouseLeave)
        .attr('fill', color)
        .attr('cx', legendInfoRadius + paddingInRect)
        .attr('cy', legendInfoRadius + paddingInRect)
        .attr('r', legendInfoRadius);

    d3Node
        .append('text')
        .on('mouseleave', handleMouseLeave)
        .attr('font-family', 'sans-serif')
        .attr('font-size', '14px')
        .attr('x', 2 * legendInfoRadius + paddingInRect + legendCircleTextPadding)
        .attr('y', 2 * legendInfoRadius + paddingInRect)
        .text(serieName);

    d3Node
        .append('text')
        .on('mouseleave', handleMouseLeave)
        .attr('font-family', 'sans-serif')
        .attr('font-size', '14px')
        .attr('x', paddingInRect)
        .attr('y', 2 * legendInfoRadius + extraHeight + paddingInRect - 10)
        .text(serieInfo);

    return {
        isEventTarget: isPopupContent,
        remove: () => d3Node.remove()
    };
}
