import * as d3 from 'd3';
import { max } from 'lodash';

import {
    legendCircleTextPadding,
    legendInfoRadius
} from './legend';

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
 * @param {function} isXInScope
 * @return {Object}
 */
export default function popup({
    node,
    serieName,
    serieInfo,
    coordLeft,
    coordRight,
    color,
    onMouseLeave,
    isXInScope,
    width: fixedWidth
}) {
    const [xLeft] = coordLeft;
    const [xRight] = coordRight;
    const width = fixedWidth || (baseWidth + (max([serieName.length, serieInfo.length]) * 7));

    const positionLeft = isXInScope(xLeft + width)
        ? true
        : !isXInScope(xRight - width);

    const d3Node = node
        .append('g')
        .style('cursor', 'default')
        .attr('transform', `translate(${positionLeft ? coordLeft : coordRight})`);

    const isPopupContent = (domNode) => {
        let result = false;

        d3Node.each(function each() {
            result = this.contains(domNode);
        });

        return result;
    };

    const handleMouseLeave = () => {
        if (onMouseLeave && !isPopupContent(d3.event.relatedTarget)) {
            onMouseLeave();
        }
    };

    const xOffset = positionLeft ? 0 : -width;

    d3Node
        .append('rect')
        .on('mouseleave', handleMouseLeave)
        .attr('x', xOffset)
        .attr('y', 0)
        .attr('fill', '#fff')
        .attr('stroke', '#000')
        .attr('height', (legendInfoRadius * 2) + extraHeight + border)
        .attr('width', width);

    d3Node
        .append('circle')
        .on('mouseleave', handleMouseLeave)
        .attr('fill', color)
        .attr('cx', legendInfoRadius + paddingInRect + xOffset)
        .attr('cy', legendInfoRadius + paddingInRect)
        .attr('r', legendInfoRadius);

    d3Node
        .append('text')
        .on('mouseleave', handleMouseLeave)
        .attr('font-family', 'sans-serif')
        .attr('font-size', '14px')
        .attr('x', (2 * legendInfoRadius) + paddingInRect + legendCircleTextPadding + xOffset)
        .attr('y', (2 * legendInfoRadius) + paddingInRect)
        .text(serieName);

    d3Node
        .append('text')
        .on('mouseleave', handleMouseLeave)
        .attr('font-family', 'sans-serif')
        .attr('font-size', '14px')
        .attr('x', paddingInRect + xOffset)
        .attr('y', ((2 * legendInfoRadius) + extraHeight + paddingInRect) - 10)
        .text(serieInfo);

    return {
        isEventTarget: isPopupContent,
        remove: () => d3Node.remove()
    };
}
